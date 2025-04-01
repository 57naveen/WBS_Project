import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from wbs.routing import websocket_urlpatterns
from wbs.consumers import TaskConsumer
from django.urls import re_path


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pm.settings")
django.setup()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  
    "websocket": URLRouter([
        re_path(r"ws/tasks/$", TaskConsumer.as_asgi()),  # Define your WebSocket route
    ]),
})