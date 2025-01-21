 const socket = io.connect();
        let selectedDevice = null;

        // Update the device list
        socket.on('device_list', (data) => {
            const deviceListDiv = document.getElementById('devices');
            deviceListDiv.innerHTML = ''; // Clear existing devices
            data.devices.forEach((device) => {
                const deviceDiv = document.createElement('div');
                deviceDiv.classList.add('device');
                deviceDiv.textContent = device;

                deviceDiv.onclick = () => {
                    selectedDevice = device;
                    document.getElementById('currentDevice').textContent = `Selected Device: ${device}`;
                    document.getElementById('fileInput').click();
                };

                deviceListDiv.appendChild(deviceDiv);
            });
        });

        function sendFile(inputElement) {
            if (!selectedDevice) {
                alert('Please select a device first.');
                return;
            }
            if (!inputElement.files.length) {
                alert('No file selected.');
                return;
            }

            const file = inputElement.files[0];
            const reader = new FileReader();

            reader.onload = function (event) {
                const fileData = event.target.result;
                socket.emit('file_send', { target: selectedDevice, file: fileData, name: file.name });
            };
            reader.readAsDataURL(file);
        }

        socket.on('file_receive', (data) => {
            const fileData = data.file;

            const link = document.createElement('a');
            link.href = fileData;
            link.download = data.name || 'received_file'; 
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

function createCircle() {
    const circle = document.createElement('div');
    circle.classList.add('signal-animation');
    document.body.appendChild(circle);

    circle.style.top = '70%';
    circle.style.left = '43%';
}

setInterval(createCircle, 2000); 
