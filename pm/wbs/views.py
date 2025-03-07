from rest_framework import viewsets
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from .models import Project, Task, Employee, TaskAssignment 
from .serializers import ProjectSerializer, TaskSerializer, EmployeeSerializer, TaskAssignmentSerializer
from .task_breakdown import get_project_information_and_breakdown
from .tasks import assign_tasks_with_llm

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
                return JsonResponse({"message": "Tasks inserted successfully", "tasks_count": len(tasks_to_create)})

            return JsonResponse({"message": "No tasks to insert"}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)    


# Task Assignment API
@csrf_exempt
def trigger_task_assignment(request):
    result = assign_tasks_with_llm.delay()  # Run Celery task asynchronously
    return JsonResponse({"status": "Task started", "task_id": result.id})


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
        


from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def notify_task_update(task):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "task_updates", {"type": "send_task_update", "message": {"task_id": task.id, "status": task.status}}
    )

