import os

class Config:
    DEBUG = True
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your_secret_key_here')
    
    # Azure SQL database configuration
    DB_CONFIG = {
        'user': os.environ.get('DB_USER'),
        'password': os.environ.get('DB_PASSWORD'),
        'host': os.environ.get('DB_HOST'),
        'database': os.environ.get('DB_DATABASE'),
        'port': os.environ.get('DB_PORT', 1433)
    }
    
    # Define other configurations as needed