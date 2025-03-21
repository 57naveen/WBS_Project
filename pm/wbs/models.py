from django.db import models
from django.utils import timezone

class Project(models.Model):
    """Stores project details."""
    name = models.CharField(max_length=255)
    description = models.TextField()
    deadline = models.DateField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Employee(models.Model):
    """Stores employee details."""
    ROLE_CHOICES = [
        ('Employee', 'Employee'),
        ('Manager', 'Manager'),
        ('Admin', 'Admin'),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=100, choices=ROLE_CHOICES, default='Employee')
    manager = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL)  # Manager field
    availability = models.BooleanField(default=True)
    on_leave = models.BooleanField(default=False)
    workload = models.IntegerField(default=0)
    max_tasks_per_day = models.IntegerField(default=3)
    performance_rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.0)
    skills = models.CharField(max_length=500, help_text="Comma-separated list of skills")  # Changed from JSONField to CharField

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Task(models.Model):
    """Stores task details."""
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Assigned', 'Assigned'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Overdue', 'Overdue'),
    ]

    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True)
    assigned_to = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True)
    deadline = models.DateField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')  # ✅ Choices added
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')  # ✅ Priority field
    required_skills = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    progress = models.IntegerField(default=0)  # ✅ Add Progress Field
    comment = models.TextField(blank=True, null=True)  # ✅ Add Comment Field

    def save(self, *args, **kwargs):
        """Ensure task deadline is within project deadline."""
        if self.progress == 100:  
            self.status = "Completed"  # ✅ Auto-update status when 100%
            
        if self.project and self.deadline > self.project.deadline:
            raise ValueError("Task deadline cannot be later than the project's deadline.")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class TaskAssignment(models.Model):
    """Stores task assignment details."""
    STATUS_CHOICES = [
        ('Assigned', 'Assigned'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Overdue', 'Overdue'),
    ]

    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    assigned_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Assigned')  # ✅ Choices added

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.task.title} -> {self.employee.name}"
