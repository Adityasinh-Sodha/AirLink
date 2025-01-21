# AirLink

AirLink is a streamlined and user-friendly web-based file-sharing platform designed to facilitate secure and fast file transfers between devices connected to the same network.

## Features

### 1. **Device Discovery**
- Automatically detects devices on the same network.
- Displays available devices in an interactive list.
- Simple click-to-select device functionality.

### 2. **File Sharing**
- Select files using your device's native file picker.
- Send files directly to the selected device with a single click.
- Supports various file types and sizes.

### 3. **Dynamic UI/UX**
- **Responsive Design**: Works seamlessly on desktops, tablets, and mobile devices.
- **Visual Feedback**: Real-time status updates during device discovery and file transfer.


### 4. **Seamless Integration**
- Uses a local IP-based network communication system.
- Incorporates Socket.IO for real-time communication between devices.
- No external dependencies after initial setup, with all required files stored in the `static` folder.

## Setup Instructions

### Prerequisites
- Python 3.x installed on your system.
- Flask framework.

### Steps
1. Clone the repository or download the project files.
2. Install necessary library:
   ```
   pip install -r requirements.txt
   ```
3. Run the `app.py` file:
   ```bash
   python3 app.py
   ```
4. Open your web browser and go to `http://<local_ip>:5000`.

### Folder Structure
```
AirLink/
├── static/
│   ├── styles.css
│   ├── script.js
│   ├── socket.io.min.js
├── templates/
│   ├── index.html
├── app.py
```


## Technologies Used
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Python (Flask)
- **Real-time Communication**: Socket.IO


## License
This project is licensed under the MIT License.
## Author
Developed by **Adityasinh**.

---

Experience the ease of sharing files with **AirLink**. Happy Sharing!
