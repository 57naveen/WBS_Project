from celery import shared_task
from django.core.mail import send_mail
from django.db.models import Count, F, Q
from django.http import JsonResponse
from wbs.signals import send_task_update
from wbs.models import Task, Employee, TaskAssignment
import logging
import json
import requests
import re
import os
from .email_notifications import send_task_assignment_email
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from datetime import date
from decimal import Decimal
from django.core.exceptions import ObjectDoesNotExist
import google.generativeai as genai
from django.conf import settings

logger = logging.getLogger(__name__)

# # 🔹 Load API key from environment variable for better security
# GROQ_API_KEY = "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" 
# GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


# 🔹 Configure the Gemini AI client
genai.configure(api_key=settings.GEMINI_API_KEY)

class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle date and Decimal serialization"""
    def default(self, obj):
        if isinstance(obj, date):
            return obj.isoformat()  # Convert date to string
        if isinstance(obj, Decimal):
            return float(obj)  # Convert Decimal to float
        return super().default(obj)

def notify_task_update():
    """Notifies WebSocket clients about task updates"""
    channel_layer = get_channel_layer()
    tasks = list(Task.objects.values())

    for task in tasks:
        if "due_date" in task and isinstance(task["due_date"], date):
            task["due_date"] = task["due_date"].isoformat()  # 🔹 Convert date to string

    async_to_sync(channel_layer.group_send)(
        "tasks",
        {
            "type": "send_task_update",
            "tasks": json.dumps(tasks, cls=DateTimeEncoder),
        }
    )


class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)  # Convert Decimal to float
        return super().default(obj)
        
@shared_task
def assign_tasks_with_gemini(selected_tasks_json):
    """Assigns unassigned tasks to eligible employees using Gemini AI"""
    assigned_task_messages = []  # ✅ Store assigned task messages
    skipped_reasons = []  # ✅ Store skipped task reasons
    unassigned_tasks_Message = []

    logger.info("\U0001F4E4 Received tasks JSON: %s", selected_tasks_json)

    # 🔹 Step 1: Parse Input JSON
    try:
        parsed_data = json.loads(selected_tasks_json)
        selected_tasks = parsed_data.get("tasks", [])
        logger.info(" Parsed %d tasks", len(selected_tasks))
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(" JSON Decode Error: %s", e)
        return {"status": "error", "message": "Invalid JSON format.", "assigned_tasks": [], "skipped_reasons": []}

    # 🔹 Step 2: Filter Unassigned Tasks
    unassigned_tasks = [
        task for task in selected_tasks if isinstance(task, dict) and task.get("status") not in ["Assigned", "Completed"]
    ]

    if not unassigned_tasks:
        logger.warning("No unassigned tasks to process.")
        unassigned_tasks_Message.append("No unassigned tasks to process.")
        return {"status": "warning", "message": "No unassigned tasks to process.", "assigned_tasks": [], "skipped_reasons": []}

    # 🔹 Step 3: Get Available Employees
    employees = list(
        Employee.objects.filter(availability=True, on_leave=False)
        .annotate(current_tasks=Count("task"))
        .values("id", "name", "skills", "performance_rating", "max_tasks_per_day", "current_tasks")
    )

    if not employees:
        logger.warning("No eligible employees available.")
        return {"status": "warning", "message": "No eligible employees available.", "assigned_tasks": [], "skipped_reasons": []}

    # 🔹 Step 4: Prepare LLM Request with Correct Format
    prompt = (
        "You are an AI that assigns tasks to employees based on skills, availability, workload, "
        "maximum tasks per day, and performance rating.\n\n"
        "### INSTRUCTIONS ###\n"
        "1️⃣ STRICTLY return a JSON array.\n"
        "2️⃣ NO extra text, NO Markdown, NO explanations.\n"
        "3️⃣ Response format:\n"
        "[{\"task_id\": 1, \"employee_id\": 2}, {\"task_id\": 2, \"employee_id\": 3}]\n"
        "4️⃣ Do not use escape sequences or additional text.\n"
    )

    user_input = json.dumps({"tasks": unassigned_tasks, "employees": employees}, cls=CustomJSONEncoder)

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt + "\n\n" + user_input)

        assigned_tasks = response.text.strip()

        # Ensure the response is properly formatted JSON
        match = re.search(r"\[.*\]", assigned_tasks, re.DOTALL)
        if not match:
            raise ValueError("Invalid response format. JSON not found.")

        json_content = match.group(0).strip()
        assignments = json.loads(json_content)

        if not isinstance(assignments, list):
            raise ValueError("Invalid format. Expected a list of assignments.")

    except (json.JSONDecodeError, ValueError) as e:
        logger.error("Gemini response is not valid JSON: %s", e)
        return {"status": "error", "message": "Invalid Gemini response format.", "assigned_tasks": [], "skipped_reasons": []}

    # 🔹 Step 5: Assign Tasks
    assigned_count = 0

    for assignment in assignments:
        task_id = assignment.get("task_id")
        employee_id = assignment.get("employee_id")

        if not task_id or not employee_id:
            logger.warning("Skipping invalid assignment: %s", assignment)
            continue

        try:
            task = Task.objects.get(id=task_id)
            employee = Employee.objects.get(id=employee_id)

            if employee.task_set.count() >= employee.max_tasks_per_day:
                reason = f"Skipping task {task_id}, {employee.name} has reached max tasks per day."
                logger.info("🚫 " + reason)
                skipped_reasons.append(reason)  # ✅ Store skipped reason
                continue

            # ✅ Assign task
            task.assigned_to = employee
            task.status = "Assigned"
            task.save(update_fields=["assigned_to", "status"])

            # ✅ Update workload
            Employee.objects.filter(id=employee.id).update(workload=F("workload") + 1)

            # ✅ Track task assignment
            TaskAssignment.objects.create(task=task, employee=employee, status="Assigned")

            assigned_count += 1
            assignment_msg = f" Assigned '{task.title}' to {employee.name}"
            assigned_task_messages.append({"task_id": task.title, "employee_id": employee.name})
            logger.info(assignment_msg)

            # ✅ Notify employee
            send_task_assignment_email(employee, task)
            notify_task_update()

        except ObjectDoesNotExist:
            logger.error("Task or Employee does not exist (Task ID: %s, Employee ID: %s)", task_id, employee_id)

    # 🔹 Step 6: Return Final Response to Frontend
    status = "success" if assigned_count > 0 else "warning"
    message = (
        f"✅ Assigned {assigned_count} tasks using Gemini."
        if assigned_count > 0
        else "No tasks assigned."
    )

    response_data = {
        "status": status,
        "message": message,
        "assigned_count": assigned_count,
        "assigned_tasks": assigned_task_messages,
        "skipped_reasons": skipped_reasons,  # ✅ Include skipped reasons
        "unassigned_tasks_Message":unassigned_tasks_Message
    }

    logger.info("\U0001F4E4 Sending response to frontend: %s", response_data)

    # 🔹 Send WebSocket Update (Optional)
    send_ws_update(response_data)

    return response_data  # ✅ Ensure frontend gets this response




def send_ws_update(data):
    """Send a real-time WebSocket update to the frontend"""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "task_updates",  # Group name (frontend should listen to this)
        {
            "type": "task.update",
            "data": data,
        },
    )