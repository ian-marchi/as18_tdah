from .config import FRONTEND_DIST_DIR

try:
    from flask_cors import CORS
except ImportError:  # pragma: no cover - optional until dependencies are installed
    CORS = None


def create_app():
    from flask import Flask

    from .routes.health import health_bp
    from .routes.leads import leads_bp
    from .routes.quiz import quiz_bp

    app = Flask(
        __name__,
        static_folder=str(FRONTEND_DIST_DIR),
        static_url_path="/",
    )
    app.config["JSON_SORT_KEYS"] = False

    if CORS is not None:
        CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(health_bp, url_prefix="/api/health")
    app.register_blueprint(leads_bp, url_prefix="/api/leads")
    app.register_blueprint(quiz_bp, url_prefix="/api/quiz")

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
