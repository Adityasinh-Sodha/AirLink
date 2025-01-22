import os
import socket
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app)

devices = {}

hostname = socket.gethostname()
local_ip = socket.gethostbyname(hostname)

# Function to forward a port
def forward_port(port, internal_port):
    try:
        os.system(f"sudo iptables -t nat -A PREROUTING -p tcp --dport {port} -j REDIRECT --to-port {internal_port}")
        print(f"Port {port} forwarded to internal port {internal_port} successfully!")
    except Exception as e:
        print(f"Error forwarding port {port}: {e}")

@app.route('/')
def index():
    return render_template('index.html', local_ip=local_ip)

@socketio.on('connect')
def handle_connect():
    device_name = request.headers.get('User-Agent')
    if "Android" in device_name:
        device_name = "Android Device"
    else:
        device_name = hostname 

    devices[request.sid] = {'ip': local_ip, 'name': device_name}
    emit('device_list', {'devices': [device['name'] for device in devices.values()]}, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    if request.sid in devices:
        del devices[request.sid]
    emit('device_list', {'devices': [device['name'] for device in devices.values()]}, broadcast=True)

@socketio.on('file_send')
def handle_file_send(data):
    target_device = data['target']
    file_data = data['file']
    for sid, device in devices.items():
        if device['name'] == target_device:
            emit('file_receive', {'file': file_data}, room=sid)
            break

@socketio.on('file_receive')
def handle_file_receive(data):
    print("File data received:", data['file'])

if __name__ == '__main__':
    forwarded_port = 8080  # Change this to your desired external port
    internal_port = 5000   # Flask app internal port
    forward_port(forwarded_port, internal_port)  # Forward external port to internal port
    app.run(host='0.0.0.0', port=internal_port, debug=True)
    socketio.run(app, port=internal_port)
