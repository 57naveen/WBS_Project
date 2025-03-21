from rest_framework import viewsets
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

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