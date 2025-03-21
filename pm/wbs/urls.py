from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, TaskViewSet, EmployeeViewSet, TaskAssignmentViewSet,
    task_breakdown_view, trigger_task_assignment, get_task_result,get_employee_data,update_task
)

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'task-assignments', TaskAssignmentViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/task-breakdown/', task_breakdown_view, name='task-breakdown'),
    path('api/assign-tasks/', trigger_task_assignment, name='assign_tasks'),
    path("api/task-result/<str:task_id>/", get_task_result, name="task-result"),
    path("api/get-employee-data/", get_employee_data, name="get_employee_data"),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/update-task/<int:task_id>/", update_task, name="update_task"),
]
