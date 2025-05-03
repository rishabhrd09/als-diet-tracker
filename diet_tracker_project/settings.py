# diet_tracker_project/settings.py

"""
Django settings for diet_tracker_project project.
Configured for production deployment on Render, reading sensitive
settings from environment variables.
"""

from pathlib import Path
import os
import dj_database_url         # To parse DATABASE_URL environment variable
from dotenv import load_dotenv # To load .env file for local development

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# --- Environment Variable Loading ---
# Load environment variables from .env file if it exists (mainly for local development)
# Looks for .env in the parent directory of this settings file (i.e., the project root)
dotenv_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=dotenv_path) # Load variables from .env file

# --- Core Security Settings ---

# SECURITY WARNING: keep the secret key used in production secret!
# Read SECRET_KEY from environment variable.
# Provide a basic fallback *only* for local development convenience if .env is missing.
# THIS FALLBACK VALUE SHOULD NOT BE USED IN PRODUCTION. Generate a new one for Render.
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-!!local-dev-fallback-key-must-be-overridden!!'
)

# SECURITY WARNING: don't run with debug turned on in production!
# Read DEBUG status from environment variable (treat 'True'/'true'/'1' as True).
# Defaults to True for local development if not set in .env or environment.
# Render will set DEBUG=False via environment variables.
DEBUG = os.environ.get('DEBUG', 'True').lower() in ['true', '1']

# Define allowed hosts for the application.
# Read from environment variable (comma-separated string).
# Render automatically adds its own hostname, but we define fallbacks for local.
# Example value for Render env var: your-app-name.onrender.com
allowed_hosts_str = os.environ.get('ALLOWED_HOSTS', '127.0.0.1,localhost')
ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_str.split(',') if host.strip()]
# Add Render's specific health check host if needed (often handled automatically)
# ALLOWED_HOSTS.append('.onrender.com')


# --- Application Definition ---

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    # WhiteNoise should be listed early, especially before staticfiles if using runserver_nostatic
    'whitenoise.runserver_nostatic', # Helpful for development static file serving
    'django.contrib.staticfiles',
    # Third-party apps
    'rest_framework',
    'corsheaders',
    # Your apps
    'diet_api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # WhiteNoise Middleware: Serves static files efficiently in production.
    # Place it right after SecurityMiddleware.
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    # CORS Middleware: Handle Cross-Origin Resource Sharing. Place high up.
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'diet_tracker_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [], # Add 'os.path.join(BASE_DIR, 'templates')' if you have project-level templates
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

WSGI_APPLICATION = 'diet_tracker_project.wsgi.application'


# --- Database ---
# https://docs.djangoproject.com/en/stable/ref/settings/#databases

# Default to SQLite for local development if DATABASE_URL is not set
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Read DATABASE_URL environment variable (set by Render or in local .env)
# This overrides the default SQLite setting if DATABASE_URL is present.
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    # Use dj_database_url to parse the database URL from the environment
    DATABASES['default'] = dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=600,          # Optional: Number of seconds database connections should persist
        conn_health_checks=True,   # Optional: Enables health checks on connections (recommended)
        ssl_require=os.environ.get('DB_SSL_REQUIRE', 'True') == 'True' # Render requires SSL for external connections
    )


# --- Password Validation ---
# https://docs.djangoproject.com/en/stable/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# --- Internationalization ---
# https://docs.djangoproject.com/en/stable/topics/i18n/
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC' # Standard practice, let Django handle timezone conversions
USE_I18N = True
USE_TZ = True # Recommended to keep True for proper timezone handling


# --- Static files (CSS, JavaScript, Images) ---
# https://docs.djangoproject.com/en/stable/howto/static-files/
STATIC_URL = '/static/'
# Directory where `collectstatic` will gather static files for production deployment.
# WhiteNoise will serve files from this directory.
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Recommended storage backend for WhiteNoise (handles compression and caching).
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}


# --- Media files (User Uploads) ---
# https://docs.djangoproject.com/en/stable/topics/files/
MEDIA_URL = '/media/'
# Directory where user-uploaded files will be stored IN DEVELOPMENT.
# NOTE: This path is NOT persistent on Render's free tier filesystem.
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


# --- CORS (Cross-Origin Resource Sharing) Settings ---
# Read allowed origins from environment variable (comma-separated string)
# Example value for Render env var: https://your-frontend-app-name.onrender.com
cors_origins_str = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_origins_str.split(',') if origin.strip()]

# It's generally safer to explicitly list origins than allow all
CORS_ALLOW_ALL_ORIGINS = False

# If using session/cookie-based authentication across domains, you might need this:
# CORS_ALLOW_CREDENTIALS = True


# --- CSRF (Cross-Site Request Forgery) Settings ---
# Read trusted origins for CSRF from environment variable (comma-separated string)
# Needed when frontend is on a different domain/port than the backend.
# Example value for Render env var: https://your-frontend-app-name.onrender.com
csrf_trusted_origins_str = os.environ.get('CSRF_TRUSTED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in csrf_trusted_origins_str.split(',') if origin.strip()]

# --- Security Settings for Production (when DEBUG=False) ---
# Uncomment and configure these as needed for enhanced security
# SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True') == 'True' # Redirect HTTP to HTTPS
# SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'True') == 'True' # Send session cookie only over HTTPS
# CSRF_COOKIE_SECURE = os.environ.get('CSRF_COOKIE_SECURE', 'True') == 'True' # Send CSRF cookie only over HTTPS
# SECURE_HSTS_SECONDS = 31536000 # 1 year - Tell browser to always use HTTPS (use small value first for testing)
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True
# SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https') # If behind a proxy like Render's


# --- Default primary key field type ---
# https://docs.djangoproject.com/en/stable/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
