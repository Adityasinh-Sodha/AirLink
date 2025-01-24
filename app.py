import eventlet
eventlet.monkey_patch()

import os
import socket
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app)

devices = {}

hostname = socket.gethostname()
local_ip = socket.gethostbyname(hostname)

@app.route('/')
def index():
    return render_template('index.html', local_ip=local_ip)

@socketio.on('connect')
def handle_connect():
    with app.app_context():  
        device_name = request.headers.get('User-Agent')
        if "Android" in device_name:
            device_name = "Android Device"
        else:
            device_name = hostname 

        devices[request.sid] = {'ip': local_ip, 'name': device_name}
        emit('device_list', {'devices': [device['name'] for device in devices.values()]}, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    with app.app_context(): 
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

if __name__ == '__main__':
    import eventlet.wsgi

    port = int(os.getenv('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True)
