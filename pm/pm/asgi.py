"""
ASGI config for pm project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from wbs.routing import websocket_urlpatterns  # Import your WebSocket routes

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pm.settings")  # Update with your project name
django.setup()

application = get_asgi_application()


application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # Handles HTTP requests
    "websocket": AuthMiddlewareStack(  # Handles WebSocket connections
        URLRouter(websocket_urlpatterns)
    ),
})