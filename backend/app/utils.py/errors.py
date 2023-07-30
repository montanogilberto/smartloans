from flask import jsonify

def not_found_error_handler(e):
    return jsonify({'message': 'Page not found'}), 404

# Add other error handlers as needed
