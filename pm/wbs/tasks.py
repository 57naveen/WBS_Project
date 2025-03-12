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

logger = logging.getLogger(__name__)

# 🔹 Load API key from environment variable for better security
GROQ_API_KEY = "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" 
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

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
def assign_tasks_with_llm(selected_tasks_json):
    """Assigns unassigned tasks to eligible employees using an LLM model"""

    assigned_task_messages = []  # ✅ Store assigned task messages

    logger.info("📤 Received tasks JSON: %s", selected_tasks_json)

    # 🔹 Step 1: Parse Input JSON
    try:
        parsed_data = json.loads(selected_tasks_json)
        selected_tasks = parsed_data.get("tasks", [])
        logger.info("✅ Parsed %d tasks", len(selected_tasks))
    except (json.JSONDecodeError, ValueError) as e:
        logger.error("❌ JSON Decode Error: %s", e)
        return {"status": "error", "message": "Invalid JSON format.", "assigned_tasks": []}

    # 🔹 Step 2: Filter Unassigned Tasks
    unassigned_tasks = [
        task for task in selected_tasks if isinstance(task, dict) and task.get("status") not in ["Assigned", "Completed"]
    ]

    if not unassigned_tasks:
        logger.warning("⚠️ No unassigned tasks to process.")
        return {"status": "warning", "message": "No unassigned tasks to process.", "assigned_tasks": []}

    # 🔹 Step 3: Get Available Employees
    employees = list(
        Employee.objects.filter(availability=True, on_leave=False)
        .annotate(current_tasks=Count("task"))
        .values("id", "name", "skills", "performance_rating", "max_tasks_per_day", "current_tasks")
    )

    if not employees:
        logger.warning("⚠️ No eligible employees available.")
        return {"status": "warning", "message": "No eligible employees available.", "assigned_tasks": []}

    # 🔹 Step 4: Prepare LLM Request
    messages = [
        {
            "role": "system",
            "content": (
                "You are an AI that assigns tasks to employees based on skills, availability, workload, "
                "maximum tasks per day, and performance rating.\n\n"
                "Strictly return a valid JSON array. Use only double quotes for keys and values.\n"
                "Ensure the response contains no extra text, no Markdown, no explanations, and no escape sequences.\n\n"
                "Format:\n"
                "[{\"task_id\": 1, \"employee_id\": 2}, {\"task_id\": 2, \"employee_id\": 3}]\n\n"
                "DO NOT include any additional text—ONLY return a valid JSON array."
            ),
        },
        {
            "role": "user",
            "content": json.dumps({"tasks": unassigned_tasks, "employees": employees}, cls=CustomJSONEncoder),
        },
    ]

    payload = {"model": "mixtral-8x7b-32768", "messages": messages, "temperature": 0.3}
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}

    # 🔹 Step 5: Send Request to LLM
    try:
        response = requests.post(GROQ_API_URL, json=payload, headers=headers)
        response.raise_for_status()
    except requests.RequestException as e:
        logger.error("❌ LLM request failed: %s", e)
        return {"status": "error", "message": "LLM request failed.", "assigned_tasks": []}

    llm_response = response.json()
    assigned_tasks = llm_response.get("choices", [{}])[0].get("message", {}).get("content", "").strip()

    if not assigned_tasks:
        logger.warning("⚠️ No tasks assigned by LLM.")
        return {"status": "warning", "message": "No tasks assigned by LLM.", "assigned_tasks": []}

    # 🔹 Step 6: Extract JSON Response from LLM
    try:
        assigned_tasks = assigned_tasks.encode("utf-8").decode("unicode_escape")  # Fix escape issues
        match = re.search(r"\[.*\]", assigned_tasks, re.DOTALL)

        if not match:
            raise ValueError("Invalid response format. JSON not found.")

        json_content = match.group(0).strip()
        assignments = json.loads(json_content)

        if not isinstance(assignments, list):
            raise ValueError("Invalid format. Expected a list of assignments.")
    except (json.JSONDecodeError, ValueError) as e:
        logger.error("❌ LLM response is not valid JSON: %s", e)
        return {"status": "error", "message": "Invalid LLM response format.", "assigned_tasks": []}

    # 🔹 Step 7: Assign Tasks
    assigned_count = 0

    for assignment in assignments:
        task_id = assignment.get("task_id")
        employee_id = assignment.get("employee_id")

        if not task_id or not employee_id:
            logger.warning("⚠️ Skipping invalid assignment: %s", assignment)
            continue

        try:
            task = Task.objects.get(id=task_id)
            employee = Employee.objects.get(id=employee_id)

            if employee.task_set.count() >= employee.max_tasks_per_day:
                logger.info("🚫 Skipping task %d, %s has reached max tasks per day.", task_id, employee.name)
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
            assignment_msg = f" Assigned '{task.title} ' to {employee.name}"
            assigned_task_messages.append(assignment_msg)
            logger.info(assignment_msg)

            # ✅ Notify employee
            send_task_assignment_email(employee, task)
            notify_task_update()

        except ObjectDoesNotExist:
            logger.error("❌ Task or Employee does not exist (Task ID: %s, Employee ID: %s)", task_id, employee_id)

        # 🔹 Step 8: Return Final Response to Frontend
    status = "success" if assigned_count > 0 else "warning"
    message = (
        f"✅ Assigned {assigned_count} tasks using LLM."
        if assigned_count > 0
        else "⚠️ No tasks assigned."
    )

    response_data = {
        "status": status,
        "message": message,
        "assigned_count": assigned_count,
        "assigned_tasks": assigned_task_messages,
    }

    logger.info("📤 Sending response to frontend: %s", response_data)

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