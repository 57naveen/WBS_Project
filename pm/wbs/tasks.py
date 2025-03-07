from celery import shared_task
from django.core.mail import send_mail
from django.db.models import Count
from wbs.models import Task, Employee, TaskAssignment
from django.db import transaction
from django.db.models import Q
import logging
# from wbs.utils import call_llm_for_task_assignment  
import json
import requests
import re
from .email_notifications import send_task_assignment_email 

from django.db.models import F

logger = logging.getLogger(__name__)

GROQ_API_KEY = "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" 
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
 

@shared_task
def assign_tasks_with_llm():
    """Assigns unassigned tasks to eligible employees using an LLM model."""

    # 1️⃣ Fetch unassigned tasks
    tasks = list(Task.objects.filter(assigned_to__isnull=True, status="Pending").values("id", "title", "description", "required_skills"))

    # 2️⃣ Fetch eligible employees (strict conditions applied)
    employees = list(
        Employee.objects.filter(availability=True, on_leave=False)
        .annotate(current_tasks=Count("task"))  # Count today's assigned tasks
        .values("id", "name", "skills", "performance_rating", "max_tasks_per_day", "current_tasks")
    )

    # Convert skills from a comma-separated string to a list
    for emp in employees:
        emp["skills"] = [skill.strip() for skill in emp["skills"].split(",")] if emp["skills"] else []
        emp["performance_rating"] = float(emp["performance_rating"])

    # Filter out employees exceeding their task limit
    employees = [emp for emp in employees if emp["current_tasks"] < emp["max_tasks_per_day"]]

    print(f"📌 Sending {len(tasks)} tasks and {len(employees)} employees to LLM...")

    if not tasks or not employees:
        print("⚠️ No tasks or eligible employees found.")
        return "No tasks or eligible employees available."

    # 3️⃣ Build the structured prompt
    messages = [
        {
            "role": "system",
            "content": (
                "You are an AI that assigns tasks to employees based on skills, availability, workload, "
                "maximum tasks per day, and performance rating.\n"
                "Return the assignments as a JSON list with the format:\n\n"
                "[{\"task_id\": 1, \"employee_id\": 2}, {\"task_id\": 2, \"employee_id\": 3}]\n\n"
                "DO NOT include any explanation or additional text—ONLY return a valid JSON array."
            )
        },
        {
            "role": "user",
            "content": json.dumps({"tasks": tasks, "employees": employees})
        }
    ]

    payload = {
        "model": "mixtral-8x7b-32768",
        "messages": messages,
        "temperature": 0.3
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    # 4️⃣ Send request to LLM
    response = requests.post(GROQ_API_URL, json=payload, headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code} - {response.json()}")
        return "LLM request failed."

    llm_response = response.json()
    print("📝 Raw LLM Response:", llm_response)  # Log LLM output

        # 5️⃣ Extract assignments from LLM response
    try:
        assigned_tasks = llm_response.get("choices", [{}])[0].get("message", {}).get("content", "")

        if not assigned_tasks.strip():
            print("⚠️ No tasks assigned by LLM.")
            return "No tasks assigned by LLM."

        # 🔹 Extract only the JSON content using regex
        match = re.search(r"\{.*\}", assigned_tasks, re.DOTALL)
        if not match:
            raise ValueError("Invalid response format. JSON not found.")

        json_content = match.group(0).strip()  # Extract valid JSON

        # 🔹 Parse the extracted JSON
        assignments = json.loads(json_content)

        if not isinstance(assignments, dict) or "assignments" not in assignments:
            raise ValueError("Invalid format. Expected a dictionary with an 'assignments' key.")

        assignments = assignments["assignments"]  # Extract the list of assignments

        if not isinstance(assignments, list):
            raise ValueError("Invalid format. Expected a list of assignments.")

    except json.JSONDecodeError:
        print("❌ LLM response is not valid JSON.")
        return "Invalid LLM response."
    except ValueError as e:
        print(f"❌ Error: {e}")
        return "Invalid LLM response format."

    # 6️⃣ Save assignments in the database
    assigned_count = 0

    for assignment in assignments:
        task_id = assignment.get("task_id")
        employee_id = assignment.get("employee_id")

        if not task_id or not employee_id:
            print(f"⚠️ Skipping invalid assignment: {assignment}")
            continue

        try:
            task = Task.objects.get(id=task_id)
            employee = Employee.objects.get(id=employee_id)

            # Final check to prevent over-assignment
            if employee.task_set.count() >= employee.max_tasks_per_day:
                print(f"🚫 Skipping task {task_id}, {employee.name} has reached max tasks per day.")
                continue

            # Assign task
            task.assigned_to = employee
            task.status = "Assigned"
            task.save(update_fields=["assigned_to", "status"])  # Efficient update

            # ✅ Update workload (atomic update)
            Employee.objects.filter(id=employee.id).update(workload=F("workload") + 1)

            # ✅ Insert into TaskAssignment table
            TaskAssignment.objects.create(
                task=task,
                employee=employee,
                status="Assigned"
            )

            assigned_count += 1
            print(f"✅ Assigned '{task.title}' to {employee.name}")

            # ✅ Send Email Notification to Employee & Manager
            send_task_assignment_email(employee, task)  # 🔥 Add this line here!

        except Task.DoesNotExist:
            print(f"❌ Task ID {task_id} does not exist.")
        except Employee.DoesNotExist:
            print(f"❌ Employee ID {employee_id} does not exist.")

    return f"✅ Assigned {assigned_count} tasks using LLM."

