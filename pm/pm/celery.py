import os
from celery import Celery
import django

# Set the default settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pm.settings')
django.setup()

app = Celery('pm')

# Load task modules from all registered Django app configs.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all Django apps
app.autodiscover_tasks()

# 👇 Fix for Windows: Use 'solo' instead of 'prefork'
if __name__ == '__main__':
    app.start()

# Auto-discover tasks from installed apps.
app.autodiscover_tasks()

# ✅ Fix: Force Celery to use a safer multiprocessing method on Windows
if os.name == 'nt':  # Windows
    import multiprocessing
    multiprocessing.set_start_method('spawn', force=True)