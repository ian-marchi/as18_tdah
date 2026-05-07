from .config import (
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    FLASK_SECRET_KEY,
    FRONTEND_DIST_DIR,
    SESSION_COOKIE_SECURE,
)
from .services.database import initialize_database

try:
    from flask_cors import CORS
except ImportError:  # pragma: no cover - optional until dependencies are installed
    CORS = None


def create_app():
    from flask import Flask

    from .routes.admin import admin_bp
    from .routes.health import health_bp
    from .routes.leads import leads_bp
    from .routes.quiz import quiz_bp
    from .routes.submissions import submissions_bp

    app = Flask(
        __name__,
        static_folder=None,
    )
    app.config["JSON_SORT_KEYS"] = False
    app.config["SECRET_KEY"] = FLASK_SECRET_KEY
    app.config["ADMIN_EMAIL"] = ADMIN_EMAIL
    app.config["ADMIN_PASSWORD"] = ADMIN_PASSWORD
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = SESSION_COOKIE_SECURE

    if CORS is not None:
        CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    initialize_database()

    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(health_bp, url_prefix="/api/health")
    app.register_blueprint(leads_bp, url_prefix="/api/leads")
    app.register_blueprint(quiz_bp, url_prefix="/api/quiz")
    app.register_blueprint(submissions_bp, url_prefix="/api/submissions")

    register_frontend_routes(app)
    return app


def register_frontend_routes(app) -> None:
    from pathlib import Path

    from flask import abort, send_from_directory

    if not FRONTEND_DIST_DIR.exists():
        return

    @app.get("/")
    def serve_index():
        return send_from_directory(FRONTEND_DIST_DIR, "index.html")

    @app.get("/<path:path>")
    def serve_frontend(path: str):
        if path.startswith("api/"):
            abort(404)

        target = FRONTEND_DIST_DIR / path
        if target.exists() and target.is_file():
            relative_path = Path(path).as_posix()
            return send_from_directory(FRONTEND_DIST_DIR, relative_path)

        return send_from_directory(FRONTEND_DIST_DIR, "index.html")
