from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from models.users import User, db

auth_bp = Blueprint('auth', __name__)

# Sample user data (you can replace this with data from your database)
users = {
    'john_doe': {
        'username': 'john_doe',
        'password_hash': generate_password_hash('secret_password')
    }
}



@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Invalid username or password'}), 400

    user = users.get(username)
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'message': 'Invalid username or password'}), 401

    # For simplicity, you can use JWT for creating tokens for authentication
    # Here, we'll just return a success message
    return jsonify({'message': 'Login successful', 'username': username}), 200

