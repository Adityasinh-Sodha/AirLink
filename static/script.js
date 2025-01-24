const socket = io.connect();
let selectedDevice = null;

socket.on('device_list', (data) => {
    const deviceListDiv = document.getElementById('devices');
    deviceListDiv.innerHTML = ''; 
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
    const chunkSize = 64 * 1024; 
    const totalChunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;

    showProgressBar();

    reader.onload = function (event) {
        const fileData = event.target.result;

        function sendChunk() {
            const start = currentChunk * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = fileData.slice(start, end);

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
                setTimeout(sendChunk, 50);
            } else {
                hideProgressBar();
            }
        }

        sendChunk();
    };

    reader.readAsDataURL(file);
}


socket.on('file_receive', (data) => {
    if (data.chunkIndex === 0) {
        showProgressBar();
        receivedFile = ''; 
    }

    receivedFile += data.chunk;
    updateProgressBar((data.chunkIndex / data.totalChunks) * 100);

    if (data.chunkIndex + 1 === data.totalChunks) {
        const link = document.createElement('a');
        link.href = receivedFile;
        link.download = data.name || 'received_file';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        hideProgressBar();
    }
});


function createCircle() {
    const circle = document.createElement('div');
    circle.classList.add('signal-animation');
    document.body.appendChild(circle);

    circle.style.top = '70%';
    circle.style.left = '43%';
}

setInterval(createCircle, 2000);

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
