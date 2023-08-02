from flask import Flask
from .config.config import DB_CONFIG
from .models.login import db
from .routes.auth import auth_bp
from .routes.init import init_bp
from .routes.protected import protected_bp

def create_app():
    app = Flask(__name__)

    # Load configuration from config.py
    app.config.from_object(DB_CONFIG)

    # Initialize the database
    db.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(init_bp)
    app.register_blueprint(protected_bp)

    return app
