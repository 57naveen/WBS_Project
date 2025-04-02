"""
Django settings for pm project.

Generated by 'django-admin startproject' using Django 4.2.10.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

from pathlib import Path
import os
from celery.schedules import crontab
from datetime import timedelta
import firebase_admin
from firebase_admin import credentials
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv() 
# db_url = os.getenv("DATABASE_URL")
# parsed_url = urlparse(db_url)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

firebase_config_path = os.path.join(BASE_DIR, "firebase_admin.json")
if not os.path.exists(firebase_config_path):
    raise FileNotFoundError(f"Firebase config file not found at: {firebase_config_path}")

cred = credentials.Certificate(os.path.join(BASE_DIR, "firebase_admin.json"))
firebase_admin.initialize_app(cred)

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-z)w*inz9^41(ler1_707uvos-bpq+iwt*%sh*d(^$_*u!yl&*0'

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['wbs-project-gn4r.onrender.com', 'localhost', '127.0.0.1']


# Application definition

INSTALLED_APPS = [
    'daphne',
    'channels',
    'rest_framework',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'wbs',
    "django_celery_beat",
    'corsheaders',
    
]


ASGI_APPLICATION = "pm.asgi.application"

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.getenv("REDIS_URL", "rediss://default:Ac6CAAIjcDE3N2IzNWNmNjBjY2M0NmI0YjVkY2Q1M2I1NjNjMDc1ZnAxMA@infinite-moose-52866.upstash.io:6379")],
             
        },
    },
}


MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
   
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
        
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),  # Short-lived token for security
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),  # Refresh token valid for 7 days
    "ROTATE_REFRESH_TOKENS": True,  # Rotate refresh tokens on every use
}

# ✅ Allow session cookies in development
CORS_ALLOW_CREDENTIALS = True  # ✅ This is required to send cookies
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_HTTPONLY = True
# CORS_ALLOW_ALL_ORIGINS = True 
ROOT_URLCONF = "pm.urls" 

CORS_ALLOW_HEADERS = [
    "content-type",  # ✅ Allow Content-Type
    "authorization",
    "x-requested-with",
    "accept",
    "origin",
    "user-agent",
    "referer",
    "accept-encoding",
    "accept-language",
]


CORS_ALLOW_METHODS = [
    "GET",
    "POST",
    "PATCH",  # ✅ Allow PATCH method
    "PUT",
    "DELETE",
    "OPTIONS",
]

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
)

CORS_ALLOWED_ORIGINS = [
    "https://workbreaksystem.web.app",
    "http://localhost:5173",
    "http://127.0.0.1:3000",  # Update with your React URL
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'pm.wsgi.application'



# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',
        'USER': 'postgres.lobqitavlqfbisaebtme',
        'PASSWORD': 'N@veen@57',  
        'HOST': 'aws-0-us-east-1.pooler.supabase.com',
        'PORT': '6543',
    }
}



CELERY_BROKER_URL = os.getenv(
    "REDIS_URL",
    "rediss://default:Ac6CAAIjcDE3N2IzNWNmNjBjY2M0NmI0YjVkY2Q1M2I1NjNjMDc1ZnAxMA@infinite-moose-52866.upstash.io:6379"
)

CELERY_RESULT_BACKEND = os.getenv(
    "REDIS_URL",
    "rediss://default:Ac6CAAIjcDE3N2IzNWNmNjBjY2M0NmI0YjVkY2Q1M2I1NjNjMDc1ZnAxMA@infinite-moose-52866.upstash.io:6379"
)

CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'

# ✅ Add SSL options for Celery Broker
CELERY_BROKER_TRANSPORT_OPTIONS = {
    "visibility_timeout": 3600,  # 1 hour timeout for tasks
    "ssl": {
        "ssl_cert_reqs": "CERT_NONE"  # Change to "CERT_REQUIRED" for strict SSL
    }
}

# ✅ Add SSL options for Celery Results Backend
CELERY_REDIS_BACKEND_USE_SSL = {
    "ssl_cert_reqs": "CERT_NONE"  # Change to "CERT_REQUIRED" for strict SSL
}

# Celery Beat Scheduler
CELERY_BEAT_SCHEDULE = {
    "assign_tasks": {
        "task": "wbs.tasks.assign_tasks_to_employees",
        "schedule": crontab(minute="*/5"),  # Runs every 5 minutes
    }
}

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"  # Replace with your SMTP server
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "naveenkishored18ca057@gmail.com"
EMAIL_HOST_PASSWORD = "zcpi zpxp zwtd qwfa"
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
