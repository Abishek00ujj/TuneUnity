import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { SkipBack, SkipForward, Play, Pause, SendHorizontal, Trash2, Users, Copy } from "lucide-react"; // Added Trash2, Users, Copy
import toast, { Toaster } from "react-hot-toast";
import loading_groic from "../assets/loading_groic.gif"; // Ensure path is correct
import YouTube from 'react-youtube'; // Import react-youtube
import io from 'socket.io-client';
import { useLocation, useParams, useNavigate } from 'react-router-dom'; // Added useParams, useNavigate
import debounce from 'lodash.debounce'; // Import debounce

// Import Chat Message Components (assuming they exist and accept props)
import MyText from './MyText'; // Needs props: id, text, name, time, showDelete, onDelete
import HerText from './HerText'; // Needs props: id, text, name, time
import AdminText from './AdminText'; // Needs props: id, text

// --- Helper Components ---

// User List Popup
const UserListPopup = ({ users, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
        <div className="bg-[#1f1f1f] text-white rounded-lg shadow-xl p-6 max-w-xs w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Users in Room ({users.length})</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
                {users.map((name, index) => (
                    <li key={index} className="flex items-center space-x-2">
                         <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                         <span>{name}</span>
                     </li>
                ))}
                 {users.length === 0 && <li className="text-gray-400">Just you here for now...</li>}
            </ul>
            <button onClick={onClose} className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                Close
            </button>
        </div>
    </div>
);

// Search Result Item
const SearchResultItem = ({ video, onPlayRequest }) => (
    <div
        className="flex items-center p-3 space-x-3 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors duration-150"
        onClick={() => onPlayRequest(video.id.videoId, video.snippet.title)}
        title={`Play: ${video.snippet.title}`}
    >
        <img
            src={video.snippet.thumbnails.default.url}
            alt={video.snippet.title}
            className="w-16 h-9 rounded object-cover flex-shrink-0"
        />
        <div className="overflow-hidden">
            <p className="text-white text-sm font-medium truncate">{video.snippet.title}</p>
            <p className="text-gray-400 text-xs truncate">{video.snippet.channelTitle}</p>
        </div>
    </div>
);

// --- Main Player Component ---

// **IMPORTANT:** Replace with your actual backend URL
 //const backendURL ='http://localhost:199'; // Use env variable
const backendURL = 'https://tuneunity-1.onrender.com'; // Or your deployed URL

let socket;

export const Player = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { roomId } = useParams(); // Get room ID from URL parameter

    // --- State Variables ---
    const [userData, setUserData] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [roomCode, setRoomCode] = useState(roomId || location.state?.roomCode); // Get room code

    // Loading states
    const [initialLoading, setInitialLoading] = useState(true); // For initial connection/setup
    const [searchLoading, setSearchLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null); // For user-facing errors

    // Player State (synced from server)
    const [currentSong, setCurrentSong] = useState(null); // { videoId, title }
    const [isPlaying, setIsPlaying] = useState(false);
    const [seekTime, setSeekTime] = useState(0); // Target seek time from server

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    // Chat State
    const [chats, setChats] = useState([]); // Array of message objects { id, user, text, timestamp }
    const [messageInput, setMessageInput] = useState("");

    // UI State
    const [activeTab, setActiveTab] = useState('search'); // 'search', 'chat', 'upnext' (Up Next not fully implemented here)
    const [showUserList, setShowUserList] = useState(false);
    const [usersInRoom, setUsersInRoom] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]); // Names of users currently typing

    // --- Refs ---
    const playerRef = useRef(null); // Ref for the YouTube player component instance
    const lastMessageRef = useRef(null); // For scrolling chat
    const isSeekingRef = useRef(false); // To prevent feedback loops during seeks
    const typingTimeoutRef = useRef(null); // For debouncing typing indicator

    // --- Memoized Values ---
    const youtubePlayerOptions = useMemo(() => ({
        height: '390', // Adjust as needed
        width: '100%', // Make responsive
        playerVars: {
            autoplay: 1, // Controlled programmatically
            controls: 0, // Disable native controls for sync
            rel: 0, // Don't show related videos at end
            modestbranding: 1, // Less YouTube branding
            enablejsapi: 1, // IMPORTANT for control
            // origin: window.location.origin // IMPORTANT for JS API security
        },
    }), []);

    // --- Helper Functions ---
    const notify = useCallback((message, options = {}) => {
        toast(message, { position: 'top-center', ...options });
    }, []);

    const getFormattedTime = useCallback(() => {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        // Simplified time format
    }, []);

    const copyRoomCode = useCallback(() => {
        if (roomCode) {
            navigator.clipboard.writeText(roomCode)
                .then(() => notify("Room code copied!", { icon: "📋" }))
                .catch(err => notify("Failed to copy code.", { icon: "❌" }));
        }
    }, [roomCode, notify]);


    // --- Effect for Initial Setup & Socket Connection ---
    useEffect(() => {
        const storedUserData = localStorage.getItem('userdata');
        if (!storedUserData || !roomCode) {
            notify("Missing user data or room code. Redirecting...", { icon: "⚠️" });
            navigate('/'); // Redirect to home if essential info is missing
            return;
        }

        try {
            const parsedData = JSON.parse(storedUserData);
            if (!parsedData?.name) throw new Error("Invalid user data format.");
            setUserData(parsedData);

            console.log(`Attempting to connect to backend at ${backendURL}`);
            socket = io(backendURL, {
                 reconnectionAttempts: 5, // Limit reconnection attempts
                 timeout: 10000, // Connection timeout
            });

             // --- Socket Event Listeners ---
            socket.on('connect', () => {
                 console.log('Socket connected:', socket.id);
                 setIsConnected(true);
                 setErrorMessage(null); // Clear previous errors
                 // Join the room *after* connection is established
                 socket.emit('join', { name: parsedData.name, room: roomCode }, (response) => {
                     if (response?.error) {
                         console.error("Failed to join room:", response.error);
                         setErrorMessage(`Failed to join: ${response.error}`);
                          notify(`Error joining room: ${response.error}`, { icon: '❌', duration: 5000 });
                          socket.disconnect(); // Disconnect if join fails
                         navigate('/'); // Redirect on critical join error
                     } else {
                         console.log('Successfully joined room:', roomCode);
                          notify(`Joined room: ${roomCode}`, { icon: '✔️' });
                         setInitialLoading(false); // Indicate loading complete
                     }
                 });
             });

            socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setIsConnected(false);
                setInitialLoading(false); // Stop loading even on error
                setErrorMessage(`Connection failed: ${error.message}. Please check the server or try again.`);
                notify("Connection Error. Trying to reconnect...", { icon: '📡', id: 'conn-error' });
            });

             socket.on('disconnect', (reason) => {
                 console.log('Socket disconnected:', reason);
                 setIsConnected(false);
                 // Only show error if it wasn't intentional
                 if (reason !== 'io client disconnect') {
                     setErrorMessage("Disconnected from server. Attempting to reconnect...");
                     notify("Disconnected. Reconnecting...", { icon: '🔌', id: 'disconnect' });
                 }
                 setCurrentSong(null); // Reset state on disconnect
                 setIsPlaying(false);
                 setUsersInRoom([]);
                 setChats([]);
                 setTypingUsers([]);
             });

            // Listener for receiving messages
            socket.on('message', (msg) => {
                 console.log('Message received:', msg);
                 setChats(prev => [...prev, msg]);
             });

              // Listener for initial chat history
             socket.on('chatHistory', (history) => {
                  console.log('Received chat history:', history.length, 'messages');
                  setChats(history || []); // Replace current chat with history
              });


            // Listener for message deletion
            socket.on('messageDeleted', (messageId) => {
                console.log('Message deletion requested for ID:', messageId);
                setChats(prev => prev.filter(msg => msg.id !== messageId));
                 notify("A message was deleted.", { icon: '🗑️' });
            });

            // Listener for full room state sync (joining, song change)
            socket.on('roomStateSync', (state) => {
                console.log('Received room state sync:', state);
                isSeekingRef.current = true; // Prevent immediate state update feedback
                setCurrentSong(state.currentSong);
                setIsPlaying(state.isPlaying);

                // Calculate seek time based on server start time
                 if (state.isPlaying && state.startTime) {
                    const serverStartTime = state.startTime;
                    const currentTime = Date.now();
                    const timeElapsed = (currentTime - serverStartTime) / 1000; // in seconds
                    const calculatedSeek = state.lastSeekTime + timeElapsed;
                    setSeekTime(calculatedSeek);
                    console.log(`Syncing player: Seek to ${calculatedSeek.toFixed(2)}s`);
                    playerRef.current?.internalPlayer?.seekTo(calculatedSeek, true);
                    playerRef.current?.internalPlayer?.playVideo(); // Ensure it plays if state is playing
                } else {
                     // If paused or no start time, use last known seek time
                     setSeekTime(state.lastSeekTime || 0);
                     console.log(`Syncing player: Seek to ${state.lastSeekTime || 0}s (paused)`);
                     playerRef.current?.internalPlayer?.seekTo(state.lastSeekTime || 0, true);
                     if (playerRef.current?.internalPlayer?.getPlayerState() === 1) { // If YT player is playing, pause it
                          playerRef.current?.internalPlayer?.pauseVideo();
                     }
                }

                // Allow seeking updates after a short delay
                 setTimeout(() => { isSeekingRef.current = false; }, 500);
            });

             // Listener for incremental playback updates (pause/play/seek from others)
            socket.on('playbackUpdate', ({ isPlaying: newIsPlaying, seekTime: newSeekTime, actionTime }) => {
                 console.log('Received playback update:', { newIsPlaying, newSeekTime });
                  isSeekingRef.current = true; // Prevent feedback loops
                  setIsPlaying(newIsPlaying); // Update local state directly

                  // Calculate more accurate seek time based on when action happened
                  const timeSinceAction = (Date.now() - actionTime) / 1000;
                  const adjustedSeek = newIsPlaying ? newSeekTime + timeSinceAction : newSeekTime;

                  setSeekTime(adjustedSeek);
                  playerRef.current?.internalPlayer?.seekTo(adjustedSeek, true);

                  if (newIsPlaying) {
                      playerRef.current?.internalPlayer?.playVideo();
                  } else {
                      playerRef.current?.internalPlayer?.pauseVideo();
                  }
                   setTimeout(() => { isSeekingRef.current = false; }, 500);
              });

            // Listener for user list updates
            socket.on('updateUserList', (userNames) => {
                 console.log('User list updated:', userNames);
                 setUsersInRoom(userNames || []);
             });

             // Listener for typing updates
             socket.on('typingUpdate', (typingUserNames) => {
                 console.log('Typing update:', typingUserNames);
                  // Filter out the current user's name if present
                 const otherTypingUsers = typingUserNames.filter(name => name !== parsedData?.name);
                 setTypingUsers(otherTypingUsers);
             });

             // --- Cleanup Function ---
             return () => {
                 console.log('Cleaning up Player component. Disconnecting socket...');
                 setInitialLoading(true); // Reset loading state on component unmount
                 if (socket) {
                    // Remove all listeners to prevent memory leaks
                    socket.off('connect');
                    socket.off('connect_error');
                    socket.off('disconnect');
                    socket.off('message');
                    socket.off('chatHistory');
                    socket.off('messageDeleted');
                    socket.off('roomStateSync');
                    socket.off('playbackUpdate');
                    socket.off('updateUserList');
                    socket.off('typingUpdate');
                    socket.disconnect();
                 }
                 setIsConnected(false);
                 setChats([]);
                 setUsersInRoom([]);
                 setTypingUsers([]);
                 setCurrentSong(null);
             };

        } catch (error) {
            console.error("Error initializing player:", error);
            notify(`Initialization Error: ${error.message}`, { icon: "❌", duration: 5000 });
            navigate('/'); // Redirect on critical setup error
            setInitialLoading(false);
            return; // Stop execution if error occurs
        }

    }, [roomCode, navigate, notify]); // Dependencies for setup

    // --- YouTube Player Event Handlers ---
    const onPlayerReady = useCallback((event) => {
        console.log("YouTube Player is ready.");
        // The player instance is event.target
        // We store the main component ref which gives access to internalPlayer
    }, []);

    const onPlayerStateChange = useCallback((event) => {
         if (isSeekingRef.current) {
             // If we are programmatically seeking, ignore the state change event briefly
             console.log("Player state change ignored during seek.");
             return;
         }

        const player = event.target;
        const currentState = player.getPlayerState();
        const currentTime = player.getCurrentTime();
        let currentIsPlaying = false;

        // YT Player States: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
        if (currentState === 1) { // Playing
             currentIsPlaying = true;
         } else if (currentState === 2) { // Paused
             currentIsPlaying = false;
         } else {
             // Ignore other states for sync purposes (like buffering, ended, cued)
             return;
         }

        // Only emit if the state *actually changed* from our known state
        if (currentIsPlaying !== isPlaying) {
            console.log(`Player state changed locally: ${currentIsPlaying ? 'Play' : 'Pause'} at ${currentTime.toFixed(2)}s. Emitting.`);
             // Optimistically update local state for responsiveness
             //setIsPlaying(currentIsPlaying); // Server response will confirm
             socket?.emit('playbackAction', { isPlaying: currentIsPlaying, currentTime });
        }
    }, [isPlaying, socket]); // Dependency: isPlaying

     const onPlayerError = useCallback((event) => {
         console.error("YouTube Player Error:", event.data);
         notify(`Player error occurred (code ${event.data}). Skipping or try another video.`, { icon: "⚠️" });
         // Handle error, e.g., try skipping to next song if available
         // handleSkipForward(); // Example: skip on error
     }, []);


    // --- Action Handlers ---

    // Search for Videos
    const handleSearch = useCallback(async (e) => {
        if (e) e.preventDefault();
        const searchTerm = searchQuery.trim();
        if (!searchTerm) return;

        setSearchLoading(true);
        setErrorMessage(null);
        setSearchResults([]); // Clear previous results

        try {
             // **IMPORTANT**: Hide API keys securely (e.g., backend proxy or environment variables)
             // Using multiple keys like this client-side is NOT recommended for production.
             let API_KEYS=["AIzaSyD6qAtIRV4stj27ziUHN8LeKTYdBPrJzZ0","AIzaSyDHjHJPKXM0tJFVCN1j0wH_cFGyprgcpwc","AIzaSyB-4iNzGs-5_qnJzasVJ2TYIvkI-GFLHRE","AIzaSyBQ2doMsFwD6TitN_VWIH7cEhtc_RkR-wo","AIzaSyD1IpLzlnCsLfo4sSMp-p9Okq7qzfPGOi8","AIzaSyCw-58Wv7HBwUSFeAKCMvylVG3EDdR3ZPQ","AIzaSyCbyQI2rLDhj_rO4p6j0l9QAtlkUwy9nuA","AIzaSyA0RfAKJPYipj75a6oIQ0tmFWs6i20tUDg","AIzaSyCamXR2_AWwutLAx16Wha2jcP7DnSdg1i4","AIzaSyBO944zaSSKHiNkiGNO5xOP5GoBDwK3f7I"];
            const apiKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
            if (apiKey.includes("YOUR_KEY")) {
                 console.warn("YouTube API Key not set in environment variables!");
                 notify("API Key not configured.", { icon: "🔧" });
                 // Optionally set error message: setErrorMessage("YouTube API key is missing.");
                 setSearchLoading(false);
                 return; // Stop if no valid key
            }


            const response = await axios.get(
                `https://www.googleapis.com/youtube/v3/search`,
                {
                    params: {
                        part: "snippet",
                        maxResults: 2, // Get more results
                        q: searchTerm,
                        type: "video",
                        key: apiKey,
                    },
                }
            );

            const fetchedVideos = response.data.items;
            if (!fetchedVideos || fetchedVideos.length === 0) {
                 notify("No videos found for your search.", { icon: "🤷" });
            }
            setSearchResults(fetchedVideos);

        } catch (err) {
            console.error("Error fetching data from YouTube API:", err);
            let errMsg = "Failed to search YouTube.";
            if (err.response?.data?.error?.message) {
                errMsg = `YouTube API Error: ${err.response.data.error.message}`;
             } else if (err.message) {
                  errMsg = err.message;
             }
            setErrorMessage(errMsg);
            notify(errMsg, { icon: "❌", duration: 4000 });
        } finally {
            setSearchLoading(false);
        }
    }, [searchQuery, notify]);

     // Request to Play a Selected Song
    const handlePlayRequest = useCallback((videoId, title) => {
        if (!socket || !isConnected) {
            notify("Not connected to server.", { icon: "❌" });
            return;
        }
         if (currentSong?.videoId === videoId) {
              notify("This song is already playing/queued.", { icon: "🎧" });
              return;
         }
        console.log(`Requesting to play: ${title} (${videoId})`);
        socket.emit('requestPlaySong', { videoId, title }, (response) => {
            if (response?.error) {
                 notify(`Error playing song: ${response.error}`, { icon: "❌" });
             } else {
                  notify(`Changing song to: ${title}`, { icon: "🎵" });
                  // State update will come via 'roomStateSync'
             }
        });
         // Optionally clear search results or switch tab
         // setSearchResults([]);
         setActiveTab('chat'); // Switch to chat after selecting a song
    }, [socket, isConnected, currentSong?.videoId, notify]);


    // Send Chat Message
    const handleSendMessage = useCallback((e) => {
        e.preventDefault();
        const text = messageInput.trim();
        if (text && socket && isConnected) {
             // Clear typing timeout if sending a message
             if (typingTimeoutRef.current) {
                 clearTimeout(typingTimeoutRef.current);
                 socket.emit('stopTyping');
                 typingTimeoutRef.current = null;
             }
            socket.emit('sendMessage', text, (response) => {
                 if (response?.error) {
                     notify(`Error sending message: ${response.error}`, { icon: "❌" });
                 } else {
                     setMessageInput(""); // Clear input on success
                 }
            });
        }
    }, [messageInput, socket, isConnected, notify]);

     // Delete Chat Message
     const handleDeleteMessage = useCallback((messageId) => {
          if (!socket || !isConnected) return;
          console.log('Requesting delete for message ID:', messageId);
          // Add a confirmation dialog?
          // if (window.confirm("Are you sure you want to delete this message?")) {
          socket.emit('deleteMessage', messageId, (response) => {
               if (response?.error) {
                    notify(`Error deleting message: ${response.error}`, { icon: "❌" });
               }
               // Deletion will be confirmed by 'messageDeleted' event
           });
         // }
     }, [socket, isConnected, notify]);


    // Handle Manual Play/Pause Button Click
     const handleTogglePlayPause = useCallback(() => {
          if (!playerRef.current || !currentSong) return;
          const player = playerRef.current.internalPlayer;
          const playerState = player.getPlayerState();

         if (playerState === 1) { // Is playing? Pause it.
             player.pauseVideo(); // Let onPlayerStateChange handle the emit
         } else { // Is paused or cued? Play it.
              player.playVideo(); // Let onPlayerStateChange handle the emit
         }

          // --- This logic moved to onPlayerStateChange ---
         // const targetIsPlaying = !(playerState === 1);
         // const currentTime = player.getCurrentTime();
         // console.log(`Manual toggle: Requesting ${targetIsPlaying ? 'Play' : 'Pause'} at ${currentTime.toFixed(2)}s`);
         // socket?.emit('playbackAction', { isPlaying: targetIsPlaying, currentTime });
         // Optimistic update (server sync will override if needed)
         // setIsPlaying(targetIsPlaying);
         // isSeekingRef.current = false; // Ensure seeking flag is reset if needed

     }, [currentSong, socket]);


    // --- Skip Forward/Backward (Placeholder - Needs Queue Logic) ---
    // These currently do nothing as there's no queue managed.
    // You would need to implement a queue (client-side or server-side)
    // and emit events to change to the next/previous song ID.
    const handleSkipForward = useCallback(() => {
        notify("Skip Forward (Next) not implemented yet.", { icon: "🚧" });
        // TODO: Implement queue and emit 'requestPlaySong' for next song
    }, [notify]);

    const handleSkipBackward = useCallback(() => {
        notify("Skip Backward (Previous) not implemented yet.", { icon: "🚧" });
        // TODO: Implement queue and emit 'requestPlaySong' for previous song
    }, [notify]);

     // --- Typing Indicator Logic ---
     const handleTyping = useCallback((e) => {
          setMessageInput(e.target.value);

          if (!socket || !isConnected) return;

           // If not already typing, send startTyping
          if (!typingTimeoutRef.current) {
               socket.emit('startTyping');
          } else {
              // If already typing, clear existing timeout
              clearTimeout(typingTimeoutRef.current);
          }

           // Set a new timeout to send stopTyping after 2 seconds of inactivity
           typingTimeoutRef.current = setTimeout(() => {
               socket.emit('stopTyping');
               typingTimeoutRef.current = null; // Clear the ref
           }, 2000); // 2 seconds delay

      }, [socket, isConnected]);


     // --- Effect for Scrolling Chat ---
     useEffect(() => {
         if (lastMessageRef.current) {
             lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
         }
     }, [chats]); // Scroll when `chats` array updates


    // --- Render Logic ---

    if (initialLoading) {
        return (
            <div className="w-screen h-screen bg-black flex flex-col justify-center items-center text-white space-y-4">
                <img src={loading_groic} alt="Loading..." className="w-24 h-24" />
                <p>Connecting to room: {roomCode}...</p>
                {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
                 <Toaster />
            </div>
        );
    }

     if (!isConnected && errorMessage) {
        return (
            <div className="w-screen h-screen bg-black flex flex-col justify-center items-center text-white space-y-4 p-4 text-center">
                <h2 className="text-2xl text-red-500">Connection Failed</h2>
                <p>{errorMessage}</p>
                 <button
                    onClick={() => window.location.reload()} // Simple retry
                    className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-500 rounded"
                 >
                    Retry Connection
                </button>
                <button
                    onClick={() => navigate('/')}
                    className="mt-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
                 >
                    Go Home
                </button>
                 <Toaster />
            </div>
        );
     }


     return (
      <>
        <Toaster />
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
          {/* Navbar/Header */}
          <header className="flex items-center justify-between p-2 sm:p-3 bg-gray-900 shadow-md flex-shrink-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-green-400 truncate" title={`Room: ${roomCode}`}>Room: {roomCode}</h1>
              <button onClick={copyRoomCode} title="Copy Room Code" className="text-gray-400 hover:text-white">
                <Copy size={16} />
              </button>
            </div>
    
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-300 hidden sm:block">User: {userData?.name}</span>
              <button onClick={() => setShowUserList(true)} title="Show Users" className="text-gray-400 hover:text-white">
                <Users size={18} />
                <span className="ml-1 text-xs">({usersInRoom.length})</span>
              </button>
              <button onClick={() => navigate('/')} title="Leave Room" className="text-red-500 hover:text-red-400 font-semibold text-sm sm:text-base">
                Leave
              </button>
            </div>
          </header>
    
          {/* Mobile Tab Navigation - Only visible on small screens */}
          <div className="md:hidden flex justify-around items-center bg-gray-800 shadow-md flex-shrink-0">
            <button
              onClick={() => setActiveTab('player')}
              className={`flex-1 py-2 text-center font-semibold text-xs uppercase tracking-wider transition-colors duration-200 ${
                activeTab === 'player'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Player
            </button>
            {['search', 'chat', 'upnext'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-center font-semibold text-xs uppercase tracking-wider transition-colors duration-200 ${
                  activeTab === tab
                    ? 'text-green-400 border-b-2 border-green-400'
                    : 'text-gray-400 hover:text-white'
                }`}
                disabled={tab === 'upnext'} // Disable Up Next for now
              >
                {tab} {tab === 'upnext' ? '(Soon)' : ''}
              </button>
            ))}
          </div>
    
          {/* Main Content Area (Player + Tabs) */}
          <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
    
            {/* Left Column: Player & Controls - Only visible when active on mobile, always visible on md+ */}
            <div className={`${activeTab === 'player' ? 'flex' : 'hidden md:flex'} w-full md:w-2/3 lg:w-3/5 flex-col p-2 sm:p-4 space-y-2 sm:space-y-4 flex-shrink-0 bg-gradient-to-b from-gray-900 to-black h-full md:h-auto`}>
              {/* YouTube Player Wrapper */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg relative flex-grow max-h-[60vh] md:max-h-none">
                {currentSong?.videoId ? (
                  <YouTube
                    ref={playerRef}
                    videoId={currentSong.videoId}
                    opts={youtubePlayerOptions}
                    onReady={onPlayerReady}
                    onStateChange={onPlayerStateChange}
                    onError={onPlayerError}
                    className="absolute top-0 left-0 w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col justify-center items-center text-gray-500">
                    <p>No song is currently playing.</p>
                    <p className="text-sm">Search for a song and click it to start!</p>
                  </div>
                )}
              </div>
    
              {/* Song Info & Controls */}
              <div className="flex flex-col items-center space-y-2 sm:space-y-3 pt-1 sm:pt-2">
                <p className="text-base sm:text-lg font-semibold text-center truncate w-full px-2 sm:px-4" title={currentSong?.title || "No Song"}>
                  {currentSong?.title || "No Song Selected"}
                </p>
    
                <div className="flex items-center justify-center space-x-4 sm:space-x-8 w-full">
                  <button onClick={handleSkipBackward} title="Previous Song (Not Implemented)" className="text-gray-400 hover:text-white disabled:opacity-50" disabled={true}>
                    <SkipBack size={28} className="sm:w-8 sm:h-8" />
                  </button>
                  <button
                    onClick={handleTogglePlayPause}
                    title={isPlaying ? "Pause" : "Play"}
                    className={`p-2 sm:p-3 rounded-full transition-colors ${
                      currentSong ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!currentSong}
                  >
                    {isPlaying ? <Pause size={28} className="sm:w-8 sm:h-8" fill="currentColor" /> : <Play size={28} className="sm:w-8 sm:h-8" fill="currentColor" />}
                  </button>
                  <button onClick={handleSkipForward} title="Next Song (Not Implemented)" className="text-gray-400 hover:text-white disabled:opacity-50" disabled={true}>
                    <SkipForward size={28} className="sm:w-8 sm:h-8" />
                  </button>
                </div>
              </div>
            </div>
    
         {/* Right Column: Tabs (Search/Chat/UpNext) */}
<div className={`${activeTab !== 'player' ? 'flex' : 'hidden md:flex'} w-full md:w-1/3 lg:w-2/5 flex-col bg-[#121212] overflow-hidden h-full`}>
  {/* Tab Navigation - Only visible on md+ screens */}
  <div className="hidden md:flex justify-around items-center bg-gray-800 shadow-md flex-shrink-0">
    {['search', 'chat', 'upnext'].map(tab => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`flex-1 py-3 text-center font-semibold text-sm uppercase tracking-wider transition-colors duration-200 ${
          activeTab === tab
            ? 'text-green-400 border-b-2 border-green-400'
            : 'text-gray-400 hover:text-white'
        }`}
        disabled={tab === 'upnext'} // Disable Up Next for now
      >
        {tab} {tab === 'upnext' ? '(Soon)' : ''}
      </button>
    ))}
  </div>

  {/* Tab Content */}
  <div className="flex-grow overflow-y-auto p-1 flex flex-col"> {/* Added flex flex-col */}
    {/* Search Tab */}
    {activeTab === 'search' && (
      <div className="flex flex-col h-full">
        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="p-2 sm:p-3 flex items-center space-x-2 sticky top-0 bg-[#121212] z-10 border-b border-gray-700">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search YouTube..."
            className="flex-grow p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button type="submit" disabled={searchLoading || !searchQuery} className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            {searchLoading ? "..." : "Search"}
          </button>
        </form>
        {/* Search Status/Error */}
        {errorMessage && !searchLoading && <p className="text-red-500 p-2 sm:p-3 text-center">{errorMessage}</p>}
        {searchLoading && (
          <div className="flex justify-center items-center p-4">
            <p>Searching...</p>
          </div>
        )}

        {/* Search Results List */}
        <div className="flex-grow overflow-y-auto p-2 space-y-1">
          {!searchLoading && searchResults.length === 0 && !errorMessage && (
            <p className="text-gray-500 text-center pt-10">Enter a search term to find videos.</p>
          )}
          {searchResults.map(video => (
            <SearchResultItem
              key={video.id.videoId}
              video={video}
              onPlayRequest={handlePlayRequest}
            />
          ))}
        </div>
      </div>
    )}

    {/* Chat Tab */}
    {activeTab === 'chat' && (
      <div className="flex flex-col h-full">
        {/* Chat Messages Area */}
        <div className="flex-grow overflow-y-auto p-2 sm:p-3 space-y-2 sm:space-y-3">
          {chats.map((item, index) => {
            // Unique key using message id if available, otherwise index
            const key = item.id || `msg-${index}`;

            if (item.user?.toLowerCase() === 'admin') {
              return <AdminText key={key} id={item.id} text={item.text} />;
            } else if (item.user?.toLowerCase() === userData?.name?.toLowerCase()) {
              return (
                <MyText
                  key={key}
                  id={item.id}
                  text={item.text}
                  name={item.user}
                  time={getFormattedTime()} // Consider storing server timestamp
                  showDelete={true} // Show delete for own messages
                  onDelete={() => handleDeleteMessage(item.id)}
                />
              );
            } else {
              return (
                <HerText
                  key={key}
                  id={item.id}
                  text={item.text}
                  name={item.user}
                  time={getFormattedTime()}
                />
              );
            }
          })}
          <div ref={lastMessageRef} /> {/* Anchor for scrolling */}
        </div>

        {/* Typing Indicator */}
        <div className="h-5 px-2 sm:px-3 text-xs text-gray-400 italic flex-shrink-0">
          {typingUsers.length > 0 && (
            <span>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          )}
        </div>

        {/* Chat Input Area - Fixed for mobile */}
        <form onSubmit={handleSendMessage} className="p-2 sm:p-3 flex items-center space-x-2 border-t border-gray-700 flex-shrink-0 sticky bottom-0 bg-[#121212] w-full">
          <input
            type="text"
            value={messageInput}
            onChange={handleTyping} // Use the debounced handler
            placeholder="Type a message..."
            className="flex-grow p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            maxLength={200} // Add max length
          />
          <button type="submit" disabled={!messageInput || !isConnected} className="p-2 bg-green-600 hover:bg-green-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
            <SendHorizontal size={20} />
          </button>
        </form>
      </div>
    )}

    {/* Up Next Tab (Placeholder) */}
    {activeTab === 'upnext' && (
      <div className="p-4 text-gray-500 text-center">
        <p>Up Next / Queue feature coming soon!</p>
        <p className="text-sm">(This would show the upcoming songs)</p>
      </div>
    )}
  </div> {/* End Tab Content */}
</div> {/* End Right Column */}
</div> {/* End Main Content Area */}
</div> {/* End Full Page Wrapper */}

{/* User List Modal */}
{showUserList && <UserListPopup users={usersInRoom} onClose={() => setShowUserList(false)} />}
</>
);
};

export default Player; // Uncomment if needed by your router setup
