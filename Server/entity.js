// entity.js
let users = []; // { id: socketId, name: string, room: string }
let roomState = {}; // { room: { currentMedia: { type, videoId/url, title }, isPlaying: bool, startTime: timestamp, lastSeekTime: number } }
let typingUsers = {}; // { room: { userId: name, ... } }

const addUsers = (id, name, room) => {
    try {
        if (!name || !room) {
            return { error: 'Name and room are required!' };
        }

        name = name.trim();
        room = room.trim().toLowerCase();

        // Prevent duplicate names *in the same room*
        const existingUserInRoom = users.find(user => user.room === room && user.name.toLowerCase() === name.toLowerCase());
        if (existingUserInRoom) {
            return { error: `Username "${name}" is already taken in this room.` };
        }

        const user = { id, name, room };
        users.push(user);
        console.log('User added:', user);
        console.log('Current users:', users);

        // Initialize room state if it doesn't exist
        if (!roomState[room]) {
            roomState[room] = {
                currentMedia: null, // { type: 'youtube'|'tv'|'radio', videoId/url, title }
                isPlaying: false,
                startTime: null,
                lastSeekTime: 0
            };
        }
        // Initialize typing users for the room
        if (!typingUsers[room]) {
            typingUsers[room] = {};
        }

        return { user };
    } catch (error) {
        console.error('Error in addUsers:', error);
        return { error: 'Internal server error adding user' };
    }
};

const removeUser = (id) => {
    const findIdx = users.findIndex(each => each.id === id);

    if (findIdx !== -1) {
        const user = users.splice(findIdx, 1)[0];
        console.log('User removed:', user);
        console.log('Remaining users:', users);

        // Clean up typing status
        if (user && typingUsers[user.room]) {
            delete typingUsers[user.room][user.id];
        }

        // Optional: Clean up roomState if room becomes empty
        const usersInRoom = getUsersInRoom(user.room);
        if (usersInRoom.length === 0) {
            console.log(`Room ${user.room} is empty, deleting state.`);
            delete roomState[user.room];
            delete typingUsers[user.room];
        }
        return user;
    }
    return null;
};

const getUser = (id) => {
    return users.find(each => each.id === id);
};

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase();
    return users.filter(user => user.room === room);
};

// --- Room State Management ---

const getRoomState = (room) => {
    return roomState[room.toLowerCase()];
}

// Updated to handle any media type (YouTube, TV, Radio)
const setRoomMedia = (room, mediaData) => {
    room = room.toLowerCase();
    if (roomState[room]) {
        roomState[room].currentMedia = mediaData; // { type, videoId/url, title }
        roomState[room].isPlaying = true; // Auto-play new media
        roomState[room].startTime = Date.now();
        roomState[room].lastSeekTime = 0; // Reset seek time for new media
        console.log(`[Room ${room}] Set media:`, roomState[room]);
    }
}

const setRoomPlayback = (room, isPlaying, seekTime) => {
    room = room.toLowerCase();
    if (roomState[room]) {
        const stateChanged = roomState[room].isPlaying !== isPlaying;
        roomState[room].isPlaying = isPlaying;
        roomState[room].lastSeekTime = seekTime;
        if (stateChanged) {
            roomState[room].startTime = Date.now();
        }
        console.log(`[Room ${room}] Set playback:`, roomState[room]);
    }
}

// --- Typing Status ---
const addTypingUser = (room, userId, userName) => {
    room = room.toLowerCase();
    if (!typingUsers[room]) typingUsers[room] = {};
    typingUsers[room][userId] = userName;
}

const removeTypingUser = (room, userId) => {
    room = room.toLowerCase();
    if (typingUsers[room]) {
        delete typingUsers[room][userId];
    }
}

const getTypingUsersInRoom = (room) => {
    room = room.toLowerCase();
    return typingUsers[room] ? Object.values(typingUsers[room]) : [];
}

module.exports = {
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
};
