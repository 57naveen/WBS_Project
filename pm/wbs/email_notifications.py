from django.core.mail import send_mail
from django.conf import settings

def send_task_assignment_email(employee, task):
    """Send a professional email notification to the assigned employee and their manager."""
    
    subject = f"Task Assignment Notification: {task.title}"
    
    employee_message = f"""
    Dear {employee.name},

    You have been assigned a new task as part of the **{task.project.name}** project. Please find the details below:

    **📌 Task:** {task.title}  
    **📆 Deadline:** {task.deadline.strftime('%Y-%m-%d')}  
    **📄 Description:** {task.description}  

    Kindly ensure timely completion of the task. If you have any questions, feel free to reach out.

    Best Regards,  
    **Project Management Team**  
    """

    # Send email to employee
    send_mail(subject, employee_message, settings.DEFAULT_FROM_EMAIL, [employee.email])

    # Notify the manager if they exist
    if employee.manager:
        manager_subject = f"Task Assigned: {task.title} (Employee: {employee.name})"
        manager_message = f"""
        Dear {employee.manager.name},

        This is to inform you that **{employee.name}** has been assigned a new task under the **{task.project.name}** project. Below are the task details:

        **📌 Task:** {task.title}  
        **📆 Deadline:** {task.deadline.strftime('%Y-%m-%d')}  
        **📄 Description:** {task.description}  

        Please ensure proper monitoring and guidance as needed.

        Best Regards,  
        **Project Management Team**  
        """

        send_mail(manager_subject, manager_message, settings.DEFAULT_FROM_EMAIL, [employee.manager.email])
