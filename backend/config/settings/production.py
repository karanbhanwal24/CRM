import os
import dj_database_url
from .base import *  # noqa: F403,F401

DEBUG = False

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env("DJANGO_SECRET_KEY")  # noqa: F405

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Configure Allowed Hosts for Render and production
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])  # noqa: F405
RENDER_EXTERNAL_HOSTNAME = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Database configuration using dj-database-url
if os.environ.get("DATABASE_URL"):
    DATABASES = {
        "default": dj_database_url.config(
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=True,
        )
    }

# CORS origins for production frontend
CORS_ALLOWED_ORIGINS = env.list(  # noqa: F405
    "DJANGO_CORS_ALLOWED_ORIGINS",
    default=["http://localhost:5173", "http://127.0.0.1:5173"]
)

# CSRF Trusted Origins for Render
if RENDER_EXTERNAL_HOSTNAME:
    CSRF_TRUSTED_ORIGINS = [
        f"https://{RENDER_EXTERNAL_HOSTNAME}",
    ]
    # Append the CORS allowed origins to CSRF trusted origins as well
    for origin in CORS_ALLOWED_ORIGINS:
        if origin.startswith("https://"):
            CSRF_TRUSTED_ORIGINS.append(origin)

# WhiteNoise settings to prevent deployment crash on missing reference links
WHITENOISE_MANIFEST_STRICT = False

