import json
from datetime import date
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Task

class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle date serialization"""
    def default(self, obj):
        if isinstance(obj, date):
            return obj.isoformat()  # Convert date to string
        return super().default(obj)

class TaskConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("tasks", self.channel_name)
        await self.accept()

        # Send current tasks immediately on connection
        tasks = await self.get_tasks()
        tasks_serializable = json.dumps(tasks, cls=DateTimeEncoder)  # ✅ Fix JSON serialization
        await self.send(text_data=tasks_serializable)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("tasks", self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        print("📥 WebSocket Received:", data)

    async def send_task_update(self, event):
        tasks = await self.get_tasks()
        tasks_serializable = json.dumps(tasks, cls=DateTimeEncoder)  # ✅ Fix JSON serialization
        await self.send(text_data=tasks_serializable)

    @sync_to_async
    def get_tasks(self):
        """Retrieve tasks and convert date fields to string"""
        tasks = list(Task.objects.values())  # Convert QuerySet to list of dictionaries
        for task in tasks:
            if "due_date" in task and isinstance(task["due_date"], date):
                task["due_date"] = task["due_date"].isoformat()  # ✅ Convert date to string
        return tasks
