import os

# Get environment variables
azure_host = os.environ.get('AZURE_DB_HOST')
azure_database = os.environ.get('AZURE_DB_NAME')
azure_user = os.environ.get('AZURE_DB_USER')
azure_password = os.environ.get('AZURE_DB_PASSWORD')
azure_port = os.environ.get('AZURE_DB_PORT')

# Database configuration
DB_CONFIG = {
    'SQLALCHEMY_DATABASE_URI': f"mysql+pymysql://{azure_user}:{azure_password}@{azure_host}:{azure_port}/{azure_database}",
    'SQLALCHEMY_TRACK_MODIFICATIONS': False,
}
