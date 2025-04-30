from rest_framework import viewsets
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from django.utils import timezone
from .models import Project, Task, Employee, TaskAssignment 
from .serializers import ProjectSerializer, TaskSerializer, EmployeeSerializer, TaskAssignmentSerializer
from .task_breakdown import get_project_information_and_breakdown
from .tasks import assign_tasks_with_gemini
from .serializers import TaskSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from celery.result import AsyncResult
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET
from rest_framework.decorators import api_view
from rest_framework.parsers import JSONParser
import firebase_admin
from firebase_admin import auth
import google.generativeai as genai
from django.conf import settings
# from datetime import date,datetime
from django.apps import apps
from django.db import connection
import logging
logger = logging.getLogger(__name__)
from django.conf import settings
import re
from datetime import datetime, date
from decimal import Decimal
from rest_framework import generics



# GEMINI_API_KEY = settings.GEMINI_API_KEY
GEMINI_API_URL = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}'
import requests



genai.configure(api_key=settings.GEMINI_API_KEY)

# CRUD API Views
class ProjectViewSet(viewsets.ModelViewSet):    
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all() 
    serializer_class = TaskSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

class TaskAssignmentViewSet(viewsets.ModelViewSet):
    queryset = TaskAssignment.objects.all()
    serializer_class = TaskAssignmentSerializer
    


# AI Task Breakdown API
@csrf_exempt
def task_breakdown_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)  # Read JSON request body
            project_name = data.get('project_name', '').strip()
            project_description = data.get('project_description', '').strip()
            deadline = data.get('deadline', '').strip()

            print("📥 Received Data:", data) 

            if not project_name or not project_description or not deadline:
                return JsonResponse({"error": "Missing parameters"}, status=400)

            # Insert or update project details
            project, created = Project.objects.get_or_create(
                name=project_name,
                defaults={'description': project_description, 'deadline': deadline}
            )
            if not created:
                project.description = project_description
                project.deadline = deadline
                project.save(update_fields=['description', 'deadline'])

            # Call AI function to get the breakdown
            breakdown_result = get_project_information_and_breakdown(project_name, project_description, deadline)

            # Ensure the response is valid JSON
            if not isinstance(breakdown_result, list):
                return JsonResponse({"error": "Invalid response from LLM", "details": breakdown_result}, status=500)

            # Insert tasks into `wbs_task`
            tasks_to_create = []
            for entry in breakdown_result:
                task_date = entry.get("date")  # Get task date
                for task in entry.get("tasks", []):  # Loop through tasks
                    task_name = task.get("task_name")
                    task_description = task.get("description")
                    required_skills = task.get("required_skills", [])  # Get required skills list

                    if task_name and task_description:
                        tasks_to_create.append(Task(
                            project=project,
                            title=task_name,
                            description=task_description,
                            deadline=task_date,
                            status="Pending",
                            required_skills=", ".join(required_skills) if isinstance(required_skills, list) else required_skills
                        ))

            if tasks_to_create:
                Task.objects.bulk_create(tasks_to_create)  # Bulk insert
                return JsonResponse({"message": "Project added successfully", "tasks_count": len(tasks_to_create)})

            return JsonResponse({"message": "No tasks to insert"}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)    


# Task Assignment API
@csrf_exempt
def trigger_task_assignment(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            selected_tasks = data.get("tasks", [])

            if not selected_tasks:
                return JsonResponse({"status": "error", "message": "No tasks selected. Please select at least one task to assign."}, status=400)

            # ✅ Trigger Celery Task
            task = assign_tasks_with_gemini.delay(json.dumps({"tasks": selected_tasks}))

            return JsonResponse({
                "status": "pending",
                "message": "Task assignment is in progress...",
                "task_id": task.id  # ✅ Returning Task ID for frontend polling
            })

        except json.JSONDecodeError:
            return JsonResponse({"status": "error", "message": "Invalid JSON format. Please check the request data."}, status=400)

    return JsonResponse({"status": "error", "message": "Invalid request method. Use POST."}, status=405)


def get_task_result(request, task_id):
    """Fetch task status and result from Celery"""
    result = AsyncResult(task_id)

    if not result:
        return JsonResponse({"status": "error", "message": "Task ID not found. Please check the task ID and try again."}, status=404)

    if result.state == "PENDING":
        return JsonResponse({"status": "pending", "message": "Task assignment is still in queue. Please wait..."})

    if result.state == "STARTED":
        return JsonResponse({"status": "processing", "message": "Task assignment is currently being processed. Please wait..."})

    if result.state == "FAILURE":
        return JsonResponse({"status": "error", "message": f"Task execution failed: {str(result.result)}"}, status=500)

    if result.state == "SUCCESS":
        response_data = result.result  # JSON returned by Celery task
        return JsonResponse({
            "status": response_data.get("status"),
            "message": response_data.get("message"),
            "assigned_count": response_data.get("assigned_count"),
            "assigned_tasks": response_data.get("assigned_tasks", []),
            "skipped_reasons": response_data.get("skipped_reasons", [])  # ✅ Include skipped reasons
        })

    return JsonResponse({"status": "processing", "message": "Task assignment is still in progress..."})

def assign_tasks(request):
    # Your logic to update tasks
    updated_task = {
        "id": 1,
        "title": "Define Project Scope and Objectives",
        "status": "Assigned"
    }

    # 🚀 Notify WebSocket clients
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "tasks",
        {
            "type": "task.update",
            "message": updated_task
        }
    )

    return JsonResponse({"status": "success", "task": updated_task})


def create_employee_view(request):
    """API view to create an employee."""
    if request.method == "POST":
        name = request.POST.get("name")
        email = request.POST.get("email")
        skills = request.POST.get("skills")
        max_tasks_per_day = request.POST.get("max_tasks_per_day", 3)

        employee, created = Employee.objects.get_or_create(
            email=email,
            defaults={"name": name, "skills": skills, "max_tasks_per_day": max_tasks_per_day}
        )

        if created:
            return JsonResponse({"message": "Employee created successfully!"}, status=201)
        else:
            return JsonResponse({"message": "Employee already exists!"}, status=400)
        

def create_task_view(request):
    """API view to create a task."""
    if request.method == "POST":
        title = request.POST.get("title")
        description = request.POST.get("description")
        deadline = request.POST.get("deadline")

        task, created = Task.objects.get_or_create(
            title=title,
            defaults={"description": description, "deadline": deadline}
        )

        if created:
            return JsonResponse({"message": "Task created successfully!"}, status=201)
        else:
            return JsonResponse({"message": "Task with this title already exists!"}, status=400)
        




def notify_task_update(task):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "task_updates", {"type": "send_task_update", "message": {"task_id": task.id, "status": task.status}}
    )

def verify_firebase_token(request):
    """Extract and verify Firebase ID token from Authorization header."""
    print("🔥 verify_firebase_token called!")  # Debugging

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        print("❌ Missing or malformed Authorization header")
        return None

    token = auth_header.split("Bearer ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        print(f"✅ Firebase token verified for user: {decoded_token.get('email')}")
        return decoded_token  # Contains user info (uid, email, etc.)
    
    except firebase_admin.auth.ExpiredIdTokenError:
        print("❌ Token expired")
    except firebase_admin.auth.RevokedIdTokenError:
        print("❌ Token revoked")
    except firebase_admin.auth.InvalidIdTokenError:
        print("❌ Invalid Token")
    except Exception as e:
        print(f"❌ General error: {str(e)}")

    return None

@api_view(["GET"])
def get_employee_data(request):
    """Fetch employee details using Firebase authentication."""
    print("🔥 get_employee_data called!")  # Debugging

    decoded_user = verify_firebase_token(request)
    if not decoded_user:
        return JsonResponse({"error": "Unauthorized. Invalid token."}, status=401)

    user_email = decoded_user.get("email")
    print(f"✅ Request received from: {user_email}")

    try:
        employee = Employee.objects.get(email=user_email)

        # Fetch assigned tasks
        tasks = Task.objects.filter(assigned_to=employee).select_related("project")

        # Fetch projects
        projects = Project.objects.filter(task__assigned_to=employee).distinct()

        data = {
            "id": employee.id,
            "name": employee.name,
            "email": employee.email,
            "role": employee.role,
            "availability": employee.availability,
            "on_leave": employee.on_leave,
            "workload": employee.workload,
            "max_tasks_per_day": employee.max_tasks_per_day,
            "performance_rating": str(employee.performance_rating),
            "skills": employee.skills.split(",") if employee.skills else [],
            "tasks": [
                {
                    "id": task.id,
                    "title": task.title,
                    "status": task.status,
                    "priority": task.priority,
                    "deadline": task.deadline.strftime("%Y-%m-%d"),
                    "project": {
                        "id": task.project.id if task.project else None,
                        "name": task.project.name if task.project else "No Project",
                    },
                }
                for task in tasks
            ],
            "projects": [
                {
                    "id": project.id,
                    "name": project.name,
                    "deadline": project.deadline.strftime("%Y-%m-%d"),
                }
                for project in projects
            ],
        }

        return JsonResponse(data, safe=False)

    except Employee.DoesNotExist:
        return JsonResponse({"error": "Employee not found"}, status=404)

    except Exception as e:
        print(f"❌ Error fetching employee data: {str(e)}")
        return JsonResponse({"error": "An error occurred while retrieving data."}, status=500)
    


@api_view(["PATCH"])
@csrf_exempt  
def update_task(request, task_id):
    """Update task progress, status, and comments (Firebase Auth)."""

    # ✅ Verify Firebase Token
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JsonResponse({"error": "Unauthorized. Missing token."}, status=401)

    token = auth_header.split("Bearer ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        user_email = decoded_token.get("email")  # Extract user email
    except Exception as e:
        return JsonResponse({"error": "Invalid or expired token."}, status=403)

    # ✅ Get Task
    task = get_object_or_404(Task, id=task_id)

    # ✅ Check if the task belongs to the user
    if task.assigned_to and task.assigned_to.email != user_email:
        return JsonResponse({"error": "You are not authorized to update this task."}, status=403)

    # ✅ Parse request body
    try:
        data = JSONParser().parse(request)
    except Exception as e:
        return JsonResponse({"error": "Invalid JSON format."}, status=400)

    progress = data.get("progress")
    comment = data.get("comment", "").strip()

    # ✅ Validate progress value
    if progress is not None:
        if not (0 <= progress <= 100):
            return JsonResponse({"error": "Progress must be between 0 and 100."}, status=400)
        task.progress = progress

    if progress != 100 and progress > 1:
        task.status = "Pending" 

    # ✅ Auto-update status to "Completed" when progress is 100%
    if progress == 100:
        task.status = "Completed"

    # ✅ Update comments if provided
    if comment:
        task.comment = comment  # Ensure you have a `comment` field in Task model

    task.save()

    return JsonResponse({
        "message": "Task updated successfully!",
        "task": {
            "id": task.id,
            "progress": task.progress,
            "status": task.status,
            "comment": task.comment,
        }
    }, status=200)



# ✅ Helper function to convert dates to string
def serialize_dates(obj):
    if isinstance(obj, date):
        return obj.strftime("%Y-%m-%d")  
    raise TypeError("Type not serializable")

@csrf_exempt
def chatbot_query(request):
    """Handles the chatbot query and returns the SQL query results."""
    if request.method == 'POST':
        try:
            # Load the incoming data
            data = json.loads(request.body)
            query = data.get('query')

            # Validate if the query is present
            if not query:
                return JsonResponse({'error': 'Missing "query" parameter in the request.'}, status=400)

            # Log the received query for debugging
            logger.debug(f"Received query: {query}")

            # Step 1: Get SQL query from Gemini
            sql_query = get_sql_from_gemini(query)
            if "Sorry" in sql_query:
                return JsonResponse({'error': 'Failed to generate SQL query from Gemini.'}, status=500)

            # Log the SQL query for debugging
            logger.debug(f"Generated SQL query: {sql_query}")

            # Step 2: Execute the SQL query and get results
            query_results = execute_sql_query(sql_query)
            if not query_results:
                return JsonResponse({'error': 'No results found for the query.'}, status=404)

            # Log the query results for debugging
            logger.debug(f"Query results: {query_results}")

            # Step 3: Get a human-readable response from Gemini
            human_answer = get_human_answer_from_gemini(query_results, query)
            if "Sorry" in human_answer:
                return JsonResponse({'error': 'Failed to generate a human-readable response from Gemini.'}, status=500)

            # Return the response
            return JsonResponse({'response': human_answer})

        except json.JSONDecodeError:
            # Handle JSON decoding errors
            logger.error("Invalid JSON format in request.")
            return JsonResponse({'error': 'Invalid JSON format in the request.'}, status=400)

        except Exception as e:
            # Log the exception and return a generic error message
            logger.error(f"An error occurred: {e}")
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)


@csrf_exempt
def get_sql_from_gemini(manager_query):
    """Get SQL query from Gemini model based on manager question."""
    prompt = f"""
    You are an expert SQL assistant. Your task is to generate a clean, executable **PostgreSQL query** for a Django backend using the schema below. Return **only the raw SQL**, without code blocks or explanation.

    Schema:

    1. wbs_project (
        id, name, description, deadline, created_at, updated_at
    )

    2. wbs_employee (
        id, name, email, role, manager_id, availability, on_leave,
        workload, max_tasks_per_day, performance_rating,
        skills, created_at, updated_at
    )

    3. wbs_task (
        id, title, description, project_id, assigned_to_id, deadline,
        status, priority, required_skills, created_at, updated_at,
        progress, comment
    )

    4. wbs_taskassignment (
        id, task_id, employee_id, assigned_date, status,
        created_at, updated_at
    )

    Relationships:
    - wbs_task.project_id → wbs_project.id
    - wbs_task.assigned_to_id → wbs_employee.id
    - wbs_taskassignment.task_id → wbs_task.id
    - wbs_taskassignment.employee_id → wbs_employee.id
    - wbs_employee.manager_id → wbs_employee.id (self-referencing)
    - Each Task is linked to a Project.
    - Each Task is optionally assigned to an Employee.
    - TaskAssignment explicitly records task assignment events.
    - Each Employee can optionally have a Manager (another Employee).

    Instructions:
    - Match employees by name when mentioned.
    - Match tasks by title when mentioned.
    - If counting is requested, return a `SELECT COUNT(*)`.
    - If grouping is needed (e.g., by project, status), use `GROUP BY`.
    - Always join tables if needed (e.g., when referring to task titles, employee names, or project names).
    - Output only one correct SQL query. No commentary, markdown, or explanations.
    - If the user mentions a name, use `ILIKE '%<name>%'` in WHERE clauses.
    - If no match is found in subqueries, ensure query does not fail—return zero rows.
    - When counting, use `COUNT(*)` and give meaningful aliases.
    - Always join related tables where needed (e.g., `wbs_task.assigned_to_id` with `wbs_employee.id`).

    User Question: "{manager_query}"
    """

    headers = {
        'Content-Type': 'application/json',
    }

    data = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    response = requests.post(GEMINI_API_URL, headers=headers, json=data)

    logger.debug(f"Raw response from Gemini (SQL generation): {response.text}")

    if response.status_code == 200:
        gemini_response = response.json()
        candidates = gemini_response.get("candidates", [])
        if candidates:
            sql_text = candidates[0]['content']['parts'][0]['text']

            # --- NEW: clean the SQL ---
            # Remove triple backticks and 'sql' keywords
            sql_text = re.sub(r'```sql|```', '', sql_text, flags=re.IGNORECASE).strip()

            logger.debug(f"Cleaned SQL query: {sql_text}")
            return sql_text
        else:
            return "No response from Gemini."
    else:
        logger.error(f"Error from Gemini API: {response.status_code} - {response.text}")
        return f"Error: {response.status_code} - {response.text}"
    


    
def get_human_answer_from_gemini(query_results, manager_query):
    """Decide between structured JSON or natural language based on the query."""
    results_json = json.dumps(query_results)

    # Define keywords that should return structured task JSON
    structured_keywords = [
        "break", "split", "convert", "structure", "extract tasks", "task breakdown"
    ]

    # Check if query requires structured output
    is_structured = any(keyword in manager_query.lower() for keyword in structured_keywords)

    if is_structured:
        prompt = f"""
        You are a project assistant. Based on the following data:

        {results_json}

        And the original question:
        "{manager_query}"

        Output a JSON array of tasks. Each task must have:
        - title
        - description
        - assigned_to_id
        - required_skills (list of strings)

        Only return valid JSON. No extra explanation.
        """
    else:
        prompt = f"""
        You are a helpful assistant for a project manager.

        Here is the data from the database:
        {results_json}

        And the user's question:
        "{manager_query}"

        Write a clear and concise natural language answer based on the data.
        """

    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    response = requests.post(GEMINI_API_URL, headers=headers, json=data)

    logger.debug(f"Raw response from Gemini: {response.text}")

    if response.status_code == 200:
        try:
            gemini_response = response.json()
            candidates = gemini_response.get("candidates", [])
            if candidates:
                text = candidates[0]['content']['parts'][0]['text']
                if is_structured:
                    # Strip markdown if present
                    text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE)
                    try:
                        structured_data = json.loads(text)
                        return {"tasks": structured_data}
                    except Exception as e:
                        logger.error(f"JSON parsing error: {e}")
                        return {"response": "Failed to parse structured JSON from Gemini."}
                else:
                    return {"response": text}
            else:
                return {"response": "No answer from Gemini."}
        except Exception as e:
            logger.error(f"Gemini response parsing failed: {e}")
            return {"response": "Gemini API returned invalid format."}
    else:
        logger.error(f"Gemini API error: {response.status_code} - {response.text}")
        return {"response": f"Error: {response.status_code} - {response.text}"}

def serialize_value(value):
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value

def execute_sql_query(sql_query):
    """Execute the SQL query and return the results."""
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql_query)
            results = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            results_dict = [
                {col: serialize_value(val) for col, val in zip(columns, row)}
                for row in results
            ]
            return results_dict
    except Exception as e:
        logger.error(f"SQL execution error: {e}")
        return str(e)
    


class TaskUpdateView(generics.UpdateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    lookup_field = 'pk'