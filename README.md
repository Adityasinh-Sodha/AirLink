# AirLink

AirLink is a streamlined and user-friendly web-based file-sharing platform designed to facilitate secure and fast file transfers between devices connected to the same network.


![Airlink Mokeup 21](https://github.com/user-attachments/assets/e0053090-a35f-49c6-8cfb-72f4a8790c4f)



## Features
- Automatically detects devices on the same network.
- Displays available devices in list.
- Simple click-to-select device functionality.
- Send files directly to the selected device with a single click.
- Send messages via right click or hold
- Supports various file types and sizes.
- Incorporates Socket.IO for real-time communication between devices.

## Setup Instructions

### Prerequisites
- Python 3.x installed on your system.
- Flask framework.

### Steps to setup locally
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
<!--
### Folder Structure
```
AirLink/
├── static/
|   ├── back.png
│   ├── styles.css
│   ├── script.js
│   ├── socket.io.min.js
│   ├── assets/
|       ├── android-chrome-192x192.png
|       ├── apple-touch-icon.png
|       ├── favicon-16x16.png
|       ├── favicon-32x32.png
|       ├── favicon.ico
|       ├── favicon.png
|       ├── ibrand.otf
|       ├── logo.png
|       ├── cg.png
|       ├── github.png
|       ├── gitlab.png
|       ├── site.webmanifest
├── templates/
│   ├── index.html
├── app.py
```
-->

## Technologies Used
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Python (WSGI)
- **Real-time Communication**: Socket.IO

<!-- ## AirLink is live on: 
- [**Railway**](https://airlink.up.railway.app/) 
- [**Render**](https://airlink-ma0q.onrender.com/) 
-->
## License
This project is licensed under the MIT License.
## Author
Developed by **Adityasinh**.

---

Experience the ease of sharing files with **AirLink Network**. Happy Sharing!
