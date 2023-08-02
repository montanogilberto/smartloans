# app/__init__.py (main application file)

from flask import Flask
from app.config import get_config

app = Flask(__name__)

# Get the environment name from an environment variable or other sources
env_name = 'development'  # Change this based on the actual environment

# Get the appropriate configuration based on the environment name
config = get_config(env_name)

# Apply the configuration settings to the Flask app
app.config.from_object(config)

# ... other app setup and routes ...
