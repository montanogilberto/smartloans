from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from utils.security import require_auth 

protected_bp = Blueprint('protected', __name__)

@protected_bp.route('/protected', methods=['GET'])
@jwt_required()  # This will protect the route and require a valid JWT token
def protected_route():
    # Only authenticated users will be able to access this route
    return jsonify({'message': 'You have access to the protected route!'})

# Add other protected routes as needed
