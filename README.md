
# SyncTogether 🎶  
**SyncTogether** is a web app that allows users to listen to and watch YouTube videos together in real-time. Built using the MERN stack, the app ensures synchronized playback, creating a collaborative and fun experience for users.

---

## 🚀 Project Features
- **Real-Time Video Sync**: Users can play, pause, and watch YouTube videos in sync.
- **Room-Based Interaction**: Private rooms for collaborative video watching.
- **YouTube Integration**: Embedded YouTube videos using the YouTube IFrame API.
- **Scalable Backend**: Built with Node.js and Express.js.
- **Database**: MongoDB for storing room and user data.

---

## 🛠️ Tech Stack
- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **API**: YouTube Data API v3
- **Real-Time Communication**: Socket.IO

---

## 📂 Project Structure

```plaintext
SyncTogether/
├── backend/
│   ├── server.js        # Node.js server for APIs and WebSocket communication
│   ├── models/          # MongoDB models for data
│   ├── routes/          # Express routes for API endpoints
│   ├── package.json     # Backend dependencies
│   └── .env             # Environment variables (API key, etc.)
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # React pages (Home, Room, etc.)
│   │   ├── App.js       # Main app file
│   │   ├── index.js     # Entry point
│   │   ├── youtube.js   # YouTube IFrame Player logic
│   │   └── socket.js    # WebSocket integration logic
│   ├── public/
│   │   └── index.html   # Main HTML template
│   ├── package.json     # Frontend dependencies
├── README.md            # Project documentation
└── package.json         # Root dependencies
```

---

## 🖥️ How to Run the Project

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/SyncTogether.git
cd SyncTogether
```

### 2. Set Up the Backend
- Navigate to the `backend/` folder:
  ```bash
  cd backend
  ```
- Install dependencies:
  ```bash
  npm install
  ```
- Create a `.env` file and add your environment variables:
  ```plaintext
  YOUTUBE_API_KEY=your_youtube_api_key
  MONGO_URI=your_mongodb_connection_string
  PORT=5000
  ```
- Start the server:
  ```bash
  npm start
  ```

### 3. Set Up the Frontend
- Navigate to the `frontend/` folder:
  ```bash
  cd ../frontend
  ```
- Install dependencies:
  ```bash
  npm install
  ```
- Start the React development server:
  ```bash
  npm start
  ```

### 4. Test the App
- Open the app in your browser at `http://localhost:3000`.
- Open multiple tabs to test real-time synchronization.

---

## 🌟 Future Enhancements
- Room authentication with user accounts.
- Playlist creation and sharing functionality.
- Chat feature within rooms.
- Support for additional streaming platforms.

---

## 🤝 Contribution Guidelines
1. Fork the repository.
2. Create a new branch (`feature-name`).
3. Commit your changes.
4. Push to your branch and submit a pull request.

---

## 🛡️ License
This project is licensed under the MIT License. Feel free to use and modify it.

---

## 💬 Feedback
Have suggestions or questions? Reach out at abishek3834@gmail.com
