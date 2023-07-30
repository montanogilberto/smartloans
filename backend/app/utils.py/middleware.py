from flask import request

def custom_header_middleware(response):
    response.headers['X-Custom-Header'] = 'Custom Value'
    return response

# Add other middleware functions as needed
