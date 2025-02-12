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

        deviceDiv.oncontextmenu = (e) => {
            e.preventDefault();
            selectedDevice = device;
            showMessageBox(device);
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
    messageBox.style.display = 'block';

    // Add event listener to close the message box when clicking outside
    document.addEventListener('click', handleOutsideClick);
}

// Hide message box
function hideMessageBox() {
    const messageBox = document.getElementById('messageBox');
    messageBox.style.display = 'none';

    // Remove the event listener after hiding the message box
    document.removeEventListener('click', handleOutsideClick);
}

// Handle outside click to close the message box
function handleOutsideClick(event) {
    const messageBox = document.getElementById('messageBox');
    // Check if the click is outside the message box
    if (!messageBox.contains(event.target)) {
        hideMessageBox();
    }
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
        showMessagePopup(`${data.sender}: ${data.message}`);
    }
});

// Show the message box and fade-out background
function showMessageBox() {
    const overlay = document.getElementById('overlay');
    const messageBox = document.getElementById('messageBox');
    
    overlay.style.display = 'block'; // Show the overlay
    messageBox.style.display = 'block'; // Show the message box

    // Close the message box if clicked outside
    overlay.onclick = () => hideMessageBox();
}

// Hide the message box and remove fade-out background
function hideMessageBox() {
    const overlay = document.getElementById('overlay');
    const messageBox = document.getElementById('messageBox');
    
    overlay.style.display = 'none'; // Hide the overlay
    messageBox.style.display = 'none'; // Hide the message box
}

// Enable drag-and-drop for device elements
function enableDragAndDrop() {
    const devices = document.querySelectorAll('.device');

    devices.forEach((device) => {
        device.ondragover = (e) => {
            e.preventDefault();
            device.classList.add('drag-over');
        };

        device.ondragleave = () => {
            device.classList.remove('drag-over');
        };

        device.ondrop = (e) => {
            e.preventDefault();
            device.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                selectedDevice = device.textContent; // Set the selected device
                sendFile({ files: [file] }); // Call the existing sendFile function
            }
        };

        // Handle right-click for sending a message
        device.oncontextmenu = (e) => {
            e.preventDefault(); // Prevent the default context menu
            selectedDevice = device.textContent; // Set the selected device for the message
            showMessageBox(); // Show the message box for this device
        };
    });
}

// Re-enable drag-and-drop after device list updates
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

    enableDragAndDrop(); // Re-enable drag-and-drop on updated devices
});

// Function to load the Changelog content directly as HTML
document.addEventListener("DOMContentLoaded", function () {
    const changelogSection = document.getElementById("changelogSection");
    const changelogContent = document.getElementById("changelogContent");
    const changelogToggle = document.getElementById("changelogToggle");
    const closeChangelog = document.getElementById("closeChangelog");

    changelogSection.style.display = "none";

    changelogToggle.addEventListener("click", function () {
        changelogSection.style.display = "block";

        fetch("https://raw.githubusercontent.com/Adityasinh-Sodha/AirLink/refs/heads/main/CHANGELOG.md")
            .then(response => response.text())
            .then(data => {
                changelogContent.innerHTML = data;
            })
            .catch(error => {
                changelogContent.innerHTML = "<p>Error loading changelog.</p>";
            });
    });

    function closeChangelogSection() {
        changelogSection.style.display = "none";
    }

    closeChangelog.addEventListener("click", closeChangelogSection);
});
// changelog ends

document.getElementById("aboutUsButton").addEventListener("click", function (event) {
    let overlay = document.getElementById("aboutUsOverlay");
    let button = event.target; // The clicked button
    let content = document.getElementById("aboutUsContent"); // Content to show when animation occurs

    // Toggle button color and state
    if (button.classList.contains("active")) {
        button.classList.remove("active");
        button.style.color = "black"; // Normal color
        button.style.borderColor = "black"; // Normal border color

        // If overlay is active, hide it and hide content after animation ends
        overlay.classList.remove("active");
        setTimeout(() => {
            content.classList.remove("show"); // Hide content after animation
        }, 0); // Match the transition time for the overlay
    } else {
        button.classList.add("active");
        button.style.color = "white"; // White text color when active
        button.style.borderColor = "white"; // White border when active

        // Set overlay position based on button center
        let rect = button.getBoundingClientRect();
        let centerX = rect.left + rect.width / 2;
        let centerY = rect.top + rect.height / 2;

        overlay.style.left = `${centerX}px`;
        overlay.style.top = `${centerY}px`;
        overlay.classList.add("active");

        // Show the content after the animation starts
        setTimeout(() => {
            content.classList.add("show"); // Show content after overlay starts expanding
        }, 600); // Match the transition time for the overlay
    }
});
