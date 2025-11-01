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
    setRoomMedia, // Changed from setRoomSong
    setRoomPlayback,
    addTypingUser,
    removeTypingUser,
    getTypingUsersInRoom
} = require('./entity');
const { nanoid } = require('nanoid');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = socketio(server, {
    cors: {
        origin: "*", // Restrict this in production!
        methods: ["GET", "POST"],
    }
});

// Simple in-memory store for chat messages (per room)
const chatHistory = {}; // { room: [ { id, user, text, timestamp }, ... ] }

io.on('connect', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- Join Room ---
    socket.on('join', ({ name, room }, callback) => {
        console.log(`Attempting to join: User ${name}, Room ${room}`);
        const { user, error } = addUsers(socket.id, name, room);

        if (error) {
            console.error(`Join error for ${name} in ${room}: ${error}`);
            if (callback) callback({ error });
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

        // Send current room state (media, playback) to the joining user
        const currentState = getRoomState(user.room);
        if (currentState && currentState.currentMedia) {
            socket.emit('roomStateSync', currentState);
            console.log(`Sent room state sync to ${user.name}`, currentState);
        }

        // Send updated user list to everyone in the room
        const usersInRoom = getUsersInRoom(user.room).map(u => u.name);
        io.to(user.room).emit('updateUserList', usersInRoom);

        if (callback) callback({ success: true });
    });

    // --- Send Message ---
    socket.on('sendMessage', (messageText, callback) => {
        const user = getUser(socket.id);
        if (user && messageText) {
            const message = {
                id: nanoid(8),
                user: user.name,
                text: messageText,
                timestamp: Date.now()
            };
            // Add to history
            if (chatHistory[user.room]) {
                chatHistory[user.room].push(message);
                // Optional: Trim history if it gets too long
                if (chatHistory[user.room].length > 100) {
                    chatHistory[user.room].shift();
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
                if (messageIndex !== -1 && roomMessages[messageIndex].user === user.name) {
                    roomMessages.splice(messageIndex, 1);
                    io.to(user.room).emit('messageDeleted', messageId);
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

    // --- Media Control (YouTube, TV, Radio) ---
    // Client requests to play specific media
    socket.on('requestPlayMedia', (mediaData, callback) => {
        const user = getUser(socket.id);
        
        // Validate mediaData structure
        if (user && mediaData && mediaData.type && mediaData.title) {
            const validTypes = ['youtube', 'tv', 'radio'];
            
            if (!validTypes.includes(mediaData.type)) {
                if (callback) callback({ error: 'Invalid media type' });
                return;
            }

            // Validate required fields based on media type
            if (mediaData.type === 'youtube' && !mediaData.videoId) {
                if (callback) callback({ error: 'YouTube media requires videoId' });
                return;
            }
            if ((mediaData.type === 'tv' || mediaData.type === 'radio') && !mediaData.url) {
                if (callback) callback({ error: 'TV/Radio media requires url' });
                return;
            }

            console.log(`[Room ${user.room}] ${user.name} requested ${mediaData.type}: ${mediaData.title}`);
            
            setRoomMedia(user.room, mediaData);
            const newState = getRoomState(user.room);
            io.to(user.room).emit('roomStateSync', newState);
            
            if (callback) callback({ status: 'Media request processed' });

            // Announce the media change in chat
            let mediaTypeEmoji = '🎵';
            if (mediaData.type === 'tv') mediaTypeEmoji = '📺';
            if (mediaData.type === 'radio') mediaTypeEmoji = '📻';

            const announcement = {
                id: nanoid(8),
                user: 'Admin',
                text: `${user.name} changed to ${mediaTypeEmoji} ${mediaData.title}`,
                timestamp: Date.now()
            };
            if (chatHistory[user.room]) chatHistory[user.room].push(announcement);
            io.to(user.room).emit('message', announcement);

        } else {
            if (callback) callback({ error: 'Invalid media request data' });
        }
    });

    // Client reports its playback state change (play/pause/seek)
    socket.on('playbackAction', ({ isPlaying, currentTime, currentMedia }, callback) => {
        const user = getUser(socket.id);
        if (user && typeof isPlaying === 'boolean' && typeof currentTime === 'number') {
            console.log(`[Room ${user.room}] ${user.name} action: ${isPlaying ? 'Play' : 'Pause'} at ${currentTime.toFixed(2)}s`);

            // Update server's state
            setRoomPlayback(user.room, isPlaying, currentTime);
            const newState = getRoomState(user.room);

            // Broadcast the change to others
            socket.broadcast.to(user.room).emit('playbackUpdate', {
                isPlaying: newState.isPlaying,
                seekTime: newState.lastSeekTime,
                actionTime: newState.startTime,
                currentMedia: newState.currentMedia // Include current media info
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
            socket.broadcast.to(user.room).emit('typingUpdate', typingNow);
        }
    });

    socket.on('stopTyping', () => {
        const user = getUser(socket.id);
        if (user) {
            removeTypingUser(user.room, user.id);
            const typingNow = getTypingUsersInRoom(user.room);
            socket.broadcast.to(user.room).emit('typingUpdate', typingNow);
        }
    });

    // --- Disconnect ---
    socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.id}, Reason: ${reason}`);
        const user = removeUser(socket.id);
        if (user) {
            console.log(`Removed user ${user.name} from room ${user.room}`);
            // Notify others in the room
            io.to(user.room).emit('message', { id: nanoid(8), user: 'Admin', text: `${user.name} has left.` });

            // Update user list for remaining users
            const usersInRoom = getUsersInRoom(user.room).map(u => u.name);
            io.to(user.room).emit('updateUserList', usersInRoom);

            // Update typing status
            removeTypingUser(user.room, user.id);
            const typingNow = getTypingUsersInRoom(user.room);
            io.to(user.room).emit('typingUpdate', typingNow);
        } else {
            console.log(`Disconnect: Could not find user data for ${socket.id}`);
        }
    });
});

const PORT = 199;
server.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});
