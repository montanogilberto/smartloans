from flask import Flask
from config import Config
from models import db
from routes.auth import auth_bp
from routes.protected import protected_bp
from utils.middleware import custom_header_middleware
from utils.errors import not_found_error_handler

app = Flask(__name__)
app.config.from_object(Config)

# Initialize the database
db.init_app(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(protected_bp)

# Apply middleware
app.after_request(custom_header_middleware)

# Register error handlers
app.register_error_handler(404, not_found_error_handler)

if __name__ == '__main__':
    app.run()