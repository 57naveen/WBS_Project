from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
from .models import Task

@receiver(post_save, sender=Task)
def send_task_update(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    tasks = list(Task.objects.values())
   # ✅ Convert date fields to string
    json_data = json.dumps(tasks, default=str)

   # ✅ Send WebSocket update
    async_to_sync(channel_layer.group_send)(
        "task_updates",
        {"type": "task_update", "tasks": json_data},
    )
