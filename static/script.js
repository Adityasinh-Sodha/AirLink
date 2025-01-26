const socket = io.connect();
let selectedDevice = null;
let receivedFile = []; // Store file chunks as an array of ArrayBuffers

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
    const chunkSize = 64 * 1024; // 64 KB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;

    showProgressBar();

    reader.onload = function (event) {
        const fileData = event.target.result;

        function sendChunk() {
            const start = currentChunk * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = fileData.slice(start, end);

            console.log(`Sending chunk ${currentChunk + 1} of ${totalChunks}...`);

            socket.emit('file_send', {
                target: selectedDevice,
                chunk: chunk,
                name: file.name,
                chunkIndex: currentChunk,
                totalChunks: totalChunks,
            });

            currentChunk++;
            updateProgressBar((currentChunk / totalChunks) * 100);

            if (currentChunk < totalChunks) {
                setTimeout(sendChunk, 50); // Simulate delay
            } else {
                hideProgressBar();
            }
        }

        sendChunk();
    };

    // Change to readAsArrayBuffer for better chunking
    reader.readAsArrayBuffer(file);
}

socket.on('file_receive', (data) => {
    if (data.chunkIndex === 0) {
        showProgressBar();
        receivedFile = []; // Initialize the array for received chunks
    }

    // Push each chunk as an ArrayBuffer
    receivedFile.push(data.chunk);
    updateProgressBar((data.chunkIndex / data.totalChunks) * 100);

    if (data.chunkIndex + 1 === data.totalChunks) {
        // Combine all chunks and create a Blob
        const blob = new Blob(receivedFile);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = data.name || 'received_file';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        hideProgressBar();
    }
});

function showProgressBar() {
    const container = document.getElementById('progressContainer');
    const bar = document.getElementById('progressBar');
    container.style.display = 'block';
    bar.style.width = '0';
}

function updateProgressBar(percentage) {
    const bar = document.getElementById('progressBar');
    bar.style.width = percentage + '%';
}

function hideProgressBar() {
    const container = document.getElementById('progressContainer');
    container.style.display = 'none';
}

socket.on('your_name', (data) => {
    const nameDiv = document.createElement('div');
    nameDiv.innerHTML = `You are known as: <span class="styled-device-name">${data.name}</span>`;
    nameDiv.classList.add('name-container');
    document.body.appendChild(nameDiv);
});

socket.on('device_list', (data) => {
    const deviceListDiv = document.getElementById('devices');
    deviceListDiv.innerHTML = ''; // Clear existing devices
    data.devices.forEach((device) => {
        const deviceDiv = document.createElement('div');
        deviceDiv.classList.add('device');
        deviceDiv.textContent = device;

        deviceDiv.oncontextmenu = (e) => {
            e.preventDefault();
            selectedDevice = device;
            showMessageBox(device);
        };

        deviceListDiv.appendChild(deviceDiv);
    });
});
// Send a message to the selected device
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (!selectedDevice || !message) {
        alert("Target device or message is missing!");
        return;
    }

    socket.emit('send_message', { target: selectedDevice, message: message });
    messageInput.value = ''; // Clear the input box
    hideMessageBox();
}

// Show message box
function showMessageBox(device) {
    const messageBox = document.getElementById('messageBox');
    document.getElementById('targetDevice').textContent = device;
    messageBox.style.display = 'block';
}

// Hide message box
function hideMessageBox() {
    const messageBox = document.getElementById('messageBox');
    messageBox.style.display = 'none';
}

// Show popup for received messages
function showMessagePopup(message) {
    const popup = document.getElementById('messagePopup');
    const popupMessage = document.getElementById('popupMessage');
    popupMessage.textContent = message;
    popup.classList.remove('hidden');
    popup.style.display = 'block';
}

// Close the popup
document.getElementById('closePopup').onclick = () => {
    const popup = document.getElementById('messagePopup');
    popup.style.display = 'none';
};

// Listen for incoming messages
socket.on('receive_message', (data) => {
    if (data && data.message && data.sender) {
        showMessagePopup(`Message from ${data.sender}: ${data.message}`);
    }
});
