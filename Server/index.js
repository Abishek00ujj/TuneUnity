
const express = require('express');
const http = require('http');
const socketio = require("socket.io");
const cors = require('cors');
const {
    addUsers,
    removeUser,
    getUser,
    getUsersInRoom,
    getRoomState,
    setRoomSong,
    setRoomPlayback,
    addTypingUser,
    removeTypingUser,
    getTypingUsersInRoom
} = require('./entity');
const { nanoid } = require('nanoid'); // For message IDs

const app = express();
app.use(cors()); // Basic CORS setup
app.use(express.json());

const server = http.createServer(app);

const io = socketio(server, {
    cors: {
        origin: "*", // Restrict this in production!
        methods: ["GET", "POST"],
    }
});

// Simple in-memory store for chat messages (per room)
// WARNING: This will be lost on server restart and consume memory.
// Consider a database for persistence or larger scale.
const chatHistory = {}; // { room: [ { id, user, text, timestamp }, ... ] }

io.on('connect', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- Join Room ---
    socket.on('join', ({ name, room }, callback) => {
        console.log(`Attempting to join: User ${name}, Room ${room}`);
        const { user, error } = addUsers(socket.id, name, room);

        if (error) {
            console.error(`Join error for ${name} in ${room}: ${error}`);
            if (callback) callback({ error }); // Send error back to client
            return;
        }

        if (!user) {
             console.error(`Join error: User object undefined for ${name} in ${room}`);
             if (callback) callback({ error: "Failed to create user object on server." });
             return;
        }


        socket.join(user.room);
        console.log(`${user.name} (${socket.id}) joined room ${user.room}`);

        // Initialize chat history for the room if it doesn't exist
        if (!chatHistory[user.room]) {
            chatHistory[user.room] = [];
        }


        // Send welcome message to the joining user *only*
        socket.emit('message', { id: nanoid(8), user: 'Admin', text: `Welcome to the room, ${user.name}!` });

        // Send existing chat history to the joining user *only*
        socket.emit('chatHistory', chatHistory[user.room]);

        // Notify others in the room
        socket.broadcast.to(user.room).emit('message', { id: nanoid(8), user: 'Admin', text: `${user.name} has joined!` });

        // Send current room state (song, playback) to the joining user
        const currentState = getRoomState(user.room);
        if (currentState && currentState.currentSong) {
            socket.emit('roomStateSync', currentState);
            console.log(`Sent room state sync to ${user.name}`, currentState);
        }

        // Send updated user list to everyone in the room
        const usersInRoom = getUsersInRoom(user.room).map(u => u.name);
        io.to(user.room).emit('updateUserList', usersInRoom);

        if (callback) callback({ success: true }); // Acknowledge successful join

    });

    // --- Send Message ---
    socket.on('sendMessage', (messageText, callback) => {
        const user = getUser(socket.id);
        if (user && messageText) {
            const message = {
                id: nanoid(8), // Unique ID for deletion
                user: user.name,
                text: messageText,
                timestamp: Date.now()
            };
            // Add to history
            if (chatHistory[user.room]) {
                chatHistory[user.room].push(message);
                // Optional: Trim history if it gets too long
                if (chatHistory[user.room].length > 100) {
                     chatHistory[user.room].shift(); // Remove the oldest message
                }
            }
            // Broadcast message
            io.to(user.room).emit('message', message);
            console.log(`[Room ${user.room}] Message from ${user.name}: ${messageText}`);
            if (callback) callback({ status: 'Message sent' });
        } else {
             if (callback) callback({ error: 'User not found or message empty' });
        }
    });

     // --- Delete Message ---
     socket.on('deleteMessage', (messageId, callback) => {
        const user = getUser(socket.id);
        if (user && messageId) {
            const roomMessages = chatHistory[user.room];
            if (roomMessages) {
                const messageIndex = roomMessages.findIndex(msg => msg.id === messageId);
                // Basic authorization: Only allow deletion by the message sender or an 'admin' role (not implemented here)
                if (messageIndex !== -1 && roomMessages[messageIndex].user === user.name) {
                    roomMessages.splice(messageIndex, 1); // Remove from history
                    io.to(user.room).emit('messageDeleted', messageId); // Notify clients
                    console.log(`[Room ${user.room}] Message ${messageId} deleted by ${user.name}`);
                    if (callback) callback({ status: 'Message deleted' });
                } else {
                    console.log(`[Room ${user.room}] Failed deletion attempt for ${messageId} by ${user.name}`);
                    if (callback) callback({ error: 'Message not found or permission denied' });
                }
            }
        } else {
             if (callback) callback({ error: 'User not found or message ID missing' });
        }
    });


    // --- Playback Control ---
    // Client requests to play a specific song
     socket.on('requestPlaySong', ({ videoId, title }, callback) => {
        const user = getUser(socket.id);
        if (user && videoId && title) {
            console.log(`[Room ${user.room}] ${user.name} requested song: ${title} (${videoId})`);
            setRoomSong(user.room, videoId, title);
            const newState = getRoomState(user.room);
            io.to(user.room).emit('roomStateSync', newState); // Broadcast new state
            if (callback) callback({ status: 'Song request processed' });

             // Announce the song change in chat
             const announcement = {
                 id: nanoid(8),
                 user: 'Admin',
                 text: `${user.name} changed the song to: ${title}`,
                 timestamp: Date.now()
             };
             if (chatHistory[user.room]) chatHistory[user.room].push(announcement);
             io.to(user.room).emit('message', announcement);

        } else {
            if (callback) callback({ error: 'Invalid request' });
        }
    });

     // Client reports its playback state change (play/pause/seek)
    socket.on('playbackAction', ({ isPlaying, currentTime }, callback) => {
        const user = getUser(socket.id);
        if (user && typeof isPlaying === 'boolean' && typeof currentTime === 'number') {
            console.log(`[Room ${user.room}] ${user.name} action: ${isPlaying ? 'Play' : 'Pause'} at ${currentTime.toFixed(2)}s`);

            // Update server's state
            setRoomPlayback(user.room, isPlaying, currentTime);
            const newState = getRoomState(user.room);

             // Broadcast the change *only* (don't need full sync for every pause/play)
             // Send to others, not back to the sender
            socket.broadcast.to(user.room).emit('playbackUpdate', {
                isPlaying: newState.isPlaying,
                seekTime: newState.lastSeekTime,
                actionTime: newState.startTime // Timestamp of when the action occurred server-side
            });

            if (callback) callback({ status: 'Playback action received' });
        } else {
            if (callback) callback({ error: 'Invalid playback action data' });
        }
    });

    // --- Typing Indicator ---
    socket.on('startTyping', () => {
        const user = getUser(socket.id);
        if (user) {
            addTypingUser(user.room, user.id, user.name);
            const typingNow = getTypingUsersInRoom(user.room);
            socket.broadcast.to(user.room).emit('typingUpdate', typingNow); // Update others
        }
    });

    socket.on('stopTyping', () => {
        const user = getUser(socket.id);
        if (user) {
            removeTypingUser(user.room, user.id);
             const typingNow = getTypingUsersInRoom(user.room);
            socket.broadcast.to(user.room).emit('typingUpdate', typingNow); // Update others
        }
    });


    // --- Disconnect ---
    socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.id}, Reason: ${reason}`);
        const user = removeUser(socket.id); // removeUser now returns the user object
        if (user) {
            console.log(`Removed user ${user.name} from room ${user.room}`);
            // Notify others in the room
            io.to(user.room).emit('message', { id: nanoid(8), user: 'Admin', text: `${user.name} has left.` });

            // Update user list for remaining users
            const usersInRoom = getUsersInRoom(user.room).map(u => u.name);
            io.to(user.room).emit('updateUserList', usersInRoom);

             // Update typing status
             removeTypingUser(user.room, user.id); // Ensure they are removed if they disconnect while typing
             const typingNow = getTypingUsersInRoom(user.room);
             io.to(user.room).emit('typingUpdate', typingNow);
        } else {
             console.log(`Disconnect: Could not find user data for ${socket.id}`);
        }
    });
});

const PORT = 199; // Use environment variable or default
server.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});