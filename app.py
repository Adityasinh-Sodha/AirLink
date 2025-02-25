import eventlet
eventlet.monkey_patch()

import os
import socket
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import requests

app = Flask(__name__)
socketio = SocketIO(app)

devices = {}

hostname = socket.gethostname()
local_ip = socket.gethostbyname(hostname)

@app.route('/')
def index():
    return render_template('index.html', local_ip=local_ip)

def fetch_random_name():
    try:
        # Use locale 'us' for English names
        response = requests.get("https://randomuser.me/api/?nat=us")
        if response.status_code == 200:
            data = response.json()
            first_name = data['results'][0]['name']['first']
            last_name = data['results'][0]['name']['last']
            return f"{first_name} {last_name}"
        else:
            # Fallback to a default name if API fails
            return "Guest User"
    except Exception as e:
        print(f"Error fetching random name: {e}")
        return "Guest User"

@socketio.on('connect')
def handle_connect():
    client_ip = request.environ.get('REMOTE_ADDR', request.remote_addr)
    random_name = fetch_random_name()  

    # Store device info
    devices[request.sid] = {'ip': client_ip, 'name': random_name}

    print(f"New connection: {random_name} ({client_ip})")
    
    # Send device list excluding current device
    for sid in devices:
        socketio.emit('device_list', {
            'devices': [device['name'] for sid_, device in devices.items() if sid_ != sid]
        }, room=sid)

    # Send the current device its assigned name
    emit('your_name', {'name': random_name}, room=request.sid)

@socketio.on('disconnect')
def handle_disconnect():
    with app.app_context():  # Ensure context is active
        if request.sid in devices:
            del devices[request.sid]
        emit('device_list', {'devices': [device['name'] for device in devices.values()]}, broadcast=True)

@socketio.on('file_send')
def handle_file_send(data):
    target_device = data['target']
    chunk = data['chunk']
    name = data['name']
    chunk_index = data['chunkIndex']
    total_chunks = data['totalChunks']

    for sid, device in devices.items():
        if device['name'] == target_device:
            emit('file_receive', {
                'chunk': chunk,
                'name': name,
                'chunkIndex': chunk_index,
                'totalChunks': total_chunks,
            }, room=sid)
            break

@socketio.on('file_receive')
def handle_file_receive(data):
    print("File data received:", data['file'])

@socketio.on('send_message')
def handle_send_message(data):
    target_device = data.get('target')
    message = data.get('message')

    if not target_device or not message:
        emit('error', {'message': 'Target device or message is missing!'}, room=request.sid)
        return

    for sid, device in devices.items():
        if device['name'] == target_device:
            emit('receive_message', {'message': message, 'sender': devices[request.sid]['name']}, room=sid)
            break

if __name__ == '__main__':
    import eventlet.wsgi

    port = int(os.getenv('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True)
