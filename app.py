import eventlet
eventlet.monkey_patch()

import os
import socket
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import requests
import random

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
        # Check if the user has internet access
        response = requests.get("https://randomuser.me/api/?nat=us", timeout=2)  # 2-second timeout
        if response.status_code == 200:
            data = response.json()
            first_name = data['results'][0]['name']['first']
            last_name = data['results'][0]['name']['last']
            return f"{first_name} {last_name}"
    except Exception:
        # If offline or API fails, generate a name instantly
        fallback_names = [
            "Fast Cheetah", "Silver Falcon", "Crimson Wolf", "Blue Shark",
            "Iron Tiger", "Stealth Panther", "Golden Eagle", "Storm Bear"
        ]
        return random.choice(fallback_names)


@socketio.on('connect')
def handle_connect():
    client_ip = request.environ.get('REMOTE_ADDR', request.remote_addr)
    random_name = fetch_random_name()

    # Check if the user has a stored name in session
    stored_name = request.cookies.get('device_name')
    device_name = stored_name if stored_name else random_name

    # Store device info
    devices[request.sid] = {'ip': client_ip, 'name': device_name}

    print(f"New connection: {device_name} ({client_ip})")

    # Send updated device list
    update_device_list()

    # Send the current device its assigned name
    emit('your_name', {'name': device_name}, room=request.sid)

@socketio.on('rename_device')
def rename_device(data):
    new_name = data.get('new_name')

    if request.sid in devices and new_name:
        devices[request.sid]['name'] = new_name
        update_device_list()
        emit('your_name', {'name': new_name}, room=request.sid)

def update_device_list():
    for sid in devices:
        socketio.emit('device_list', {
            'devices': [device['name'] for sid_, device in devices.items() if sid_ != sid]
        }, room=sid)

@socketio.on('connect_with_name')
def handle_connect_with_name(data):
    client_ip = request.environ.get('REMOTE_ADDR', request.remote_addr)
    stored_name = data.get('saved_name')  # Get stored name from client
    device_name = stored_name if stored_name else fetch_random_name()

    # Store device info
    devices[request.sid] = {'ip': client_ip, 'name': device_name}

    print(f"New connection: {device_name} ({client_ip})")

    # Send updated device list
    update_device_list()

    # Send the current device its assigned name
    emit('your_name', {'name': device_name}, room=request.sid)


@socketio.on('disconnect')
def handle_disconnect():
    if request.sid in devices:
        disconnected_device = devices.pop(request.sid, None)
        print(f"Device disconnected: {disconnected_device['name']}")

    # Send updated device list to all remaining clients
    for sid in devices:
        socketio.emit('device_list', {
            'devices': [device['name'] for sid_, device in devices.items() if sid_ != sid]
        }, room=sid)


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
