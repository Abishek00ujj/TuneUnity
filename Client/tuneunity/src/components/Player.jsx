import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Play, Pause, SendHorizontal, Trash2, Users, Copy, Tv, Radio, Music, Video, VideoOff, X, Bell, BellOff, Smile, Image as ImageIcon } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import loading_groic from "../assets/loading_groic.gif";
import loading_groic2 from "../assets/loading_groic.gif";
import YouTube from 'react-youtube';
import io from 'socket.io-client';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import EmojiPicker from 'emoji-picker-react';

// Import Chat Message Components
import MyText from './MyText';
import HerText from './HerText';
import AdminText from './AdminText';

// --- Visualizer Component ---
const RandomBeatVisualizer = ({ data }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        let animationId;
        const bars = 50;
        const barWidth = width / bars;

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            for (let i = 0; i < bars; i++) {
                const barHeight = Math.random() * height * 0.8;
                const x = i * barWidth;
                const y = height - barHeight;

                const gradient = ctx.createLinearGradient(0, y, 0, height);
                gradient.addColorStop(0, data || '#00ff00');
                gradient.addColorStop(1, 'rgba(0, 255, 0, 0.2)');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, barWidth - 2, barHeight);
            }

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [data]);

    return (
        <canvas
            ref={canvasRef}
            width={400}
            height={100}
            className="rounded-lg"
            style={{ maxWidth: '100%' }}
        />
    );
};

// --- GIF Picker Component ---
const GifPicker = ({ onSelect, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(false);

    const TENOR_API_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ';

    useEffect(() => {
        fetchTrendingGifs();
    }, []);

    const fetchTrendingGifs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20`);
            setGifs(response.data.results || []);
        } catch (err) {
            console.error('Error fetching trending GIFs:', err);
        } finally {
            setLoading(false);
        }
    };

    const searchGifs = async (query) => {
        if (!query.trim()) {
            fetchTrendingGifs();
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(`https://tenor.googleapis.com/v2/search?q=${query}&key=${TENOR_API_KEY}&limit=20`);
            setGifs(response.data.results || []);
        } catch (err) {
            console.error('Error searching GIFs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        searchGifs(searchQuery);
    };

    return (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col">
            <div className="p-3 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                <h3 className="text-white font-semibold">Choose GIF</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X size={18} />
                </button>
            </div>
            <form onSubmit={handleSearch} className="p-2 border-b border-gray-700 flex-shrink-0">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search GIFs..."
                    className="w-full p-2 bg-gray-800 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </form>
            <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2">
                {loading ? (
                    <div className="col-span-2 flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    </div>
                ) : (
                    gifs.map((gif) => (
                        <img
                            key={gif.id}
                            src={gif.media_formats.tinygif.url}
                            alt="GIF"
                            className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => onSelect(gif.media_formats.gif.url)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

// --- Helper Components ---

const UserListPopup = ({ users, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl text-white rounded-xl shadow-2xl p-6 max-w-xs w-full mx-4 border border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
                <h3 className="text-lg font-bold">👥 Users ({users.length})</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
                {users.map((name, index) => (
                    <li key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
                         <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                         <span className="font-medium">{name}</span>
                     </li>
                ))}
                 {users.length === 0 && <li className="text-gray-400 text-center py-4">Just you here...</li>}
            </ul>
        </div>
    </div>
);

const SearchResultItem = ({ video, onPlayRequest }) => (
    <div
        className="flex items-center p-3 space-x-3 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50 rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] border border-transparent hover:border-green-500 backdrop-blur-sm"
        onClick={() => onPlayRequest(video.id.videoId, video.snippet.title)}
    >
        <img
            src={video.snippet.thumbnails.default.url}
            alt={video.snippet.title}
            className="w-16 h-9 rounded-lg object-cover flex-shrink-0 shadow-md"
        />
        <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{video.snippet.title}</p>
            <p className="text-gray-400 text-xs truncate">{video.snippet.channelTitle}</p>
        </div>
    </div>
);

const TVChannelItem = ({ channel, onPlayRequest, isActive }) => (
    <div
        className={`flex items-center p-3 space-x-3 rounded-lg cursor-pointer transition-all duration-200 border backdrop-blur-sm ${
            isActive 
                ? 'bg-gradient-to-r from-green-600/80 to-green-500/80 border-green-400 shadow-lg shadow-green-500/50' 
                : 'hover:bg-gray-700/50 hover:scale-[1.02] border-transparent hover:border-green-500'
        }`}
        onClick={() => onPlayRequest(channel)}
    >
        <Tv size={20} className={isActive ? "text-white flex-shrink-0" : "text-green-400 flex-shrink-0"} />
        <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{channel.channelName}</p>
            <p className="text-gray-300 text-xs truncate">{channel.category}</p>
        </div>
    </div>
);

const RadioStationItem = ({ station, onPlayRequest, isActive }) => (
    <div
        className={`flex items-center p-3 space-x-3 rounded-lg cursor-pointer transition-all duration-200 border backdrop-blur-sm ${
            isActive 
                ? 'bg-gradient-to-r from-blue-600/80 to-blue-500/80 border-blue-400 shadow-lg shadow-blue-500/50' 
                : 'hover:bg-gray-700/50 hover:scale-[1.02] border-transparent hover:border-blue-500'
        }`}
        onClick={() => onPlayRequest(station)}
    >
        <Radio size={20} className={isActive ? "text-white flex-shrink-0" : "text-blue-400 flex-shrink-0"} />
        <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-white text-sm font-medium truncate break-all">{station.title}</p>
            <p className="text-gray-300 text-xs truncate whitespace-nowrap">📻 Live Radio</p>
        </div>
    </div>
);

// --- Main Player Component ---

const backendURL = 'https://tuneunity-1.onrender.com';

const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

const getMediaBackground = (mediaType) => {
    switch(mediaType) {
        case 'youtube':
            return 'from-red-900/40 to-black';
        case 'tv':
            return 'from-green-900/40 to-black';
        case 'radio':
            return 'from-purple-900/40 to-black';
        default:
            return 'from-gray-900/40 to-black';
    }
};

let socket;

export const Player = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { roomId } = useParams();

    const [userData, setUserData] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [roomCode, setRoomCode] = useState(roomId || location.state?.roomCode);

    const [initialLoading, setInitialLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [tvLoading, setTvLoading] = useState(false);
    const [radioLoading, setRadioLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const [currentMedia, setCurrentMedia] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [seekTime, setSeekTime] = useState(0);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const [tvChannels, setTvChannels] = useState([]);
    const [radioStations, setRadioStations] = useState([]);

    const [chats, setChats] = useState([]);
    const [messageInput, setMessageInput] = useState("");

    const [activeTab, setActiveTab] = useState('chat');
    const [showUserList, setShowUserList] = useState(false);
    const [usersInRoom, setUsersInRoom] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);

    const [borderColor, setBorderColor] = useState(getRandomColor);
    const [loadingImage, setLoadingImage] = useState(loading_groic);

    const playerRef = useRef(null);
    const mobilePlayerRef = useRef(null);
    const videoRef = useRef(null);
    const mobileVideoRef = useRef(null);
    const audioRef = useRef(null);
    const hlsRef = useRef(null);
    const mobileHlsRef = useRef(null);
    const chatContainerRef = useRef(null);
    const isSeekingRef = useRef(false);
    const typingTimeoutRef = useRef(null);
    const activeTabRef = useRef(activeTab);
    const notificationsEnabledRef = useRef(notificationsEnabled);

    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);

    useEffect(() => {
        notificationsEnabledRef.current = notificationsEnabled;
    }, [notificationsEnabled]);

    const notify = useCallback((message, options = {}) => {
        toast(message, { position: 'top-center', ...options });
    }, []);

    const getFormattedTime = useCallback(() => {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }, []);

    const playNotificationSound = useCallback(() => {
        if (!notificationsEnabledRef.current) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (err) {
            console.error("Notification sound error:", err);
        }
    }, []);

    const copyRoomCode = useCallback(() => {
        if (roomCode) {
            navigator.clipboard.writeText(roomCode)
                .then(() => notify("Room code copied! 📋", { icon: "✅" }))
                .catch(err => notify("Failed to copy code.", { icon: "❌" }));
        }
    }, [roomCode, notify]);

    const loadTVChannels = useCallback(async () => {
        setTvLoading(true);
        try {
            const channels = [
                { channelName: "SunTV HDR10", url: "https://livestream10.sunnxt.com/DolbyVision/SunTV_HDR/SunTV_HDR_Endpoints/SunTV-HDR10-IN-index.m3u8", category: "Entertainment" },
                { channelName: "Kalaignar TV", url: "https://segment.yuppcdn.net/240122/kalaignartv/playlist.m3u8", category: "Entertainment" },
                { channelName: "News Tamil 24x7", url: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/news-tamil-24x7/index.m3u8", category: "News" },
                { channelName: "Isaiaruvi", url: "https://edge2-moblive.yuppcdn.net/drm1/smilisaiaruvi.smil/manifest.m3u8", category: "Music" },
                { channelName: "Musix India", url: "https://cdn-2.pishow.tv/live/226/master.m3u8", category: "Entertainment" },
                { channelName: "News J", url: "https://cdn-3.pishow.tv/live/1279/master.m3u8", category: "Entertainment" },
                { channelName: "Polimer Tv", url: "https://cdn-2.pishow.tv/live/1241/master.m3u8", category: "Entertainment" },
                { channelName: "Polimer News", url: "https://segment.yuppcdn.net/110322/polimernews/playlist.m3u8", category: "News" },
                { channelName: "Puthiya Thalaimurai", url: "https://segment.yuppcdn.net/240122/puthiya/playlist.m3u8", category: "News" },
                { channelName: "Siripoli", url: "https://segment.yuppcdn.net/240122/siripoli/playlist.m3u8", category: "Entertainment" },
                { channelName: "DD Tamil", url: "https://d2lk5u59tns74c.cloudfront.net/out/v1/abf46b14847e45499f4a47f3a9afe93d/index.m3u8 ", category: "Entertainment" },
                { channelName: "Dhoom Music", url: "https://cdn-1.pishow.tv/live/1456/master.m3u8", category: "Entertainment" },
                { channelName: "India Today", url: "https://indiatodaylive.akamaized.net/hls/live/2014320/indiatoday/indiatodaylive/playlist.m3u8", category: "Entertainment" },
                { channelName: "Kappa TV", url: "https://cdn-3.pishow.tv/live/1123/master.m3u8", category: "Entertainment" },
                { channelName: "Makkal TV", url: "https://5k8q87azdy4v-hls-live.wmncdn.net/MAKKAL/271ddf829afeece44d8732757fba1a66.sdp/playlist.m3u8", category: "Entertainment" },
                { channelName: "Murasu", url: "https://cdn-3.pishow.tv/live/1606/master.m3u8", category: "Entertainment" },
                { channelName: "MK Six", url: "https://cdn-3.pishow.tv/live/1253/master.m3u8", category: "Entertainment" },
                { channelName: "News 7", url: "https://segment.yuppcdn.net/240122/news7/playlist.m3u8", category: "Entertainment" },
                { channelName: "News tamil 24/7", url: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/news-tamil-24x7/index.m3u8", category: "Entertainment" },
                { channelName: "PTC Music", url: "https://d2lk5u59tns74c.cloudfront.net/out/v1/f913cf893c594f73b114216e74a2efbc/index.m3u8", category: "Entertainment" },
                { channelName: "Republic TV", url: "https://d3qs3d2rkhfqrt.cloudfront.net/out/v1/2e31d831f08640ff92f65003bdc89991/index.m3u8 ", category: "Entertainment" },
                { channelName: "PTC Music", url: "https://livestream10.sunnxt.com/DolbyVision/SuryaTV_HDR/SuryaTV_HDR_Endpoints/SuryaTV-HDR10-IN-index.m3u8 ", category: "Entertainment" },
                { channelName: "Surya TV HD", url: "https://d2lk5u59tns74c.cloudfront.net/out/v1/f913cf893c594f73b114216e74a2efbc/index.m3u8", category: "Entertainment" },
                { channelName: "Vasanth TV", url: "https://cdn-3.pishow.tv/live/1247/master.m3u8", category: "Entertainment" },
                { channelName: "Zoom TV", url: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/zoom-tv/master.m3u8", category: "Entertainment" },
                { channelName: "Tarang plus music", url: "https://livetv.tarangplus.in/tarangmusic-origin/live/playlist.m3u8", category: "Entertainment" },
                { channelName: "Sana TV HD", url: "https://galaxyott.live/hls/sanatv.m3u8", category: "Entertainment" },
                { channelName: "9x jalwa TV", url: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/9x-jalwa/master.m3u8", category: "Entertainment" },
                { channelName: "9x jhakaas TV", url: "https://amg01281-9xmediapvtltd-9xjhakaas-samsungin-ci2cs.amagi.tv/playlist/amg01281-9xmediapvtltd-9xjhakaas-samsungin/playlist.m3u8", category: "Entertainment" },
                { channelName: "9xm TV", url: "https://d35j504z0x2vu2.cloudfront.net/v1/manifest/0bc8e8376bd8417a1b6761138aa41c26c7309312/9xm/23886666-8fc5-470f-aab1-bd637ed607b1/3.m3u8", category: "Entertainment" },
                { channelName: "9x tashan TV", url: "https://amg01281-9xmediapvtltd-9xtashan-samsungin-xz1sd.amagi.tv/playlist/amg01281-9xmediapvtltd-9xtashan-samsungin/playlist.m3u8", category: "Entertainment" },
                { channelName: "B4U ", url: "https://cdnb4u.wiseplayout.com/B4U_Music/master.m3u8", category: "Entertainment" },
                { channelName: "Sana TV HD", url: "https://cdn-2.pishow.tv/live/1383/master.m3u8", category: "Entertainment" },
                { channelName: "Peppers TV", url: "https://galaxyott.live/hls/sanatv.m3u8", category: "Entertainment" },
                { channelName: "Sana plus TV", url: "https://galaxyott.live/hls/sanaplus.m3u8", category: "Entertainment" },
                { channelName: "Vaanavil TV", url: "https://6n3yope4d9ok-hls-live.5centscdn.com/vaanavil/TV.stream/playlist.m3u8", category: "Entertainment" },
                { channelName: "ZB music TV HD", url: "https://server.zillarbarta.com/zbmusic/index.m3u8", category: "Entertainment" },
                { channelName: "Joo music (PAK)", url: "https://livecdn.live247stream.com/joomusic/tv/playlist.m3u8", category: "Entertainment" },
            ];
            setTvChannels(channels);
        } catch (err) {
            console.error("Error loading TV channels:", err);
            notify("Failed to load TV channels", { icon: "❌" });
        } finally {
            setTvLoading(false);
        }
    }, [notify]);

    const loadRadioStations = useCallback(async () => {
        setRadioLoading(true);
        try {
            const liveRadioListUrl = `https://gist.githubusercontent.com/valarpirai/473305f09f8433f1d338634ed42c437d/raw/live-radio.json?id=${new Date().getTime()}`;
            const response = await axios.get(liveRadioListUrl);
            const combinedData = [...response.data[0].channels, ...response.data[1].channels];
            console.log("✅ Loaded", combinedData.length, "radio stations");
            setRadioStations(combinedData);
        } catch (err) {
            console.error("Error loading radio stations:", err);
            notify("Failed to load radio stations", { icon: "❌" });
        } finally {
            setRadioLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        const colorInterval = setInterval(() => {
            setBorderColor(getRandomColor());
        }, 5000);
        return () => clearInterval(colorInterval);
    }, []);

    useEffect(() => {
        const images = [loading_groic, loading_groic2];
        const imageInterval = setInterval(() => {
            setLoadingImage((prev) => {
                const currentIndex = images.indexOf(prev);
                const nextIndex = (currentIndex + 1) % images.length;
                return images[nextIndex];
            });
        }, 5000);
        return () => clearInterval(imageInterval);
    }, []);

    useEffect(() => {
        const storedUserData = localStorage.getItem('userdata');
        if (!storedUserData || !roomCode) {
            notify("Missing user data or room code. Redirecting...", { icon: "⚠️" });
            navigate('/');
            return;
        }

        try {
            const parsedData = JSON.parse(storedUserData);
            if (!parsedData?.name) throw new Error("Invalid user data format.");
            setUserData(parsedData);

            loadTVChannels();
            loadRadioStations();

            socket = io(backendURL, {
                reconnectionAttempts: 5,
                timeout: 10000,
            });

            socket.on('connect', () => {
                console.log('✅ Socket connected:', socket.id);
                setIsConnected(true);
                setErrorMessage(null);
                socket.emit('join', { name: parsedData.name, room: roomCode }, (response) => {
                    if (response?.error) {
                        console.error("Failed to join room:", response.error);
                        setErrorMessage(`Failed to join: ${response.error}`);
                        notify(`Error joining room: ${response.error}`, { icon: '❌', duration: 5000 });
                        socket.disconnect();
                        navigate('/');
                    } else {
                        console.log('✅ Successfully joined room:', roomCode);
                        notify(`Joined room: ${roomCode}`, { icon: '✔️' });
                        setInitialLoading(false);
                    }
                });
            });

            socket.on('connect_error', (error) => {
                console.error('❌ Socket connection error:', error);
                setIsConnected(false);
                setInitialLoading(false);
                setErrorMessage(`Connection failed: ${error.message}`);
                notify("Connection Error. Trying to reconnect...", { icon: '📡', id: 'conn-error' });
            });

            socket.on('disconnect', (reason) => {
                console.log('🔌 Socket disconnected:', reason);
                setIsConnected(false);
                if (reason !== 'io client disconnect') {
                    setErrorMessage("Disconnected from server. Attempting to reconnect...");
                    notify("Disconnected. Reconnecting...", { icon: '🔌', id: 'disconnect' });
                }
                setCurrentMedia(null);
                setIsPlaying(false);
            });

            socket.on('message', (msg) => {
                setChats(prev => [...prev, msg]);
                
                if (msg.user?.toLowerCase() !== parsedData.name?.toLowerCase() && msg.user?.toLowerCase() !== 'admin') {
                    playNotificationSound();
                    
                    if (activeTabRef.current !== 'chat' && notificationsEnabledRef.current) {
                        toast.custom((t) => (
                            <div
                                className={`${
                                    t.visible ? 'animate-enter' : 'animate-leave'
                                } max-w-md w-full bg-gradient-to-r from-green-600 to-green-500 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer`}
                                onClick={() => {
                                    setActiveTab('chat');
                                    toast.dismiss(t.id);
                                }}
                            >
                                <div className="flex-1 w-0 p-4">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-0.5">
                                            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                                                <span className="text-white font-bold text-lg">{msg.user.charAt(0).toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="text-sm font-medium text-white">
                                                {msg.user}
                                            </p>
                                            <p className="mt-1 text-sm text-white/90 line-clamp-2">
                                                {msg.text}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex border-l border-white/20">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toast.dismiss(t.id);
                                        }}
                                        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-white hover:bg-white/10 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        ), { duration: 4000, position: 'top-right' });
                    }
                }
            });

            socket.on('chatHistory', (history) => setChats(history || []));
            socket.on('messageDeleted', (messageId) => {
                setChats(prev => prev.filter(msg => msg.id !== messageId));
                notify("Message deleted 🗑️", { icon: '✅' });
            });

            socket.on('roomStateSync', (state) => {
                console.log('🔄 Room state sync:', state);
                isSeekingRef.current = true;
                setCurrentMedia(state.currentMedia);
                setIsPlaying(state.isPlaying);
                if (state.currentMedia) {
                    handleMediaChange(state.currentMedia, state.isPlaying, state.lastSeekTime, state.startTime);
                }
                setTimeout(() => { isSeekingRef.current = false; }, 500);
            });

            socket.on('playbackUpdate', ({ isPlaying: newIsPlaying, seekTime: newSeekTime, actionTime, currentMedia }) => {
                console.log('⏯️ Playback update:', { newIsPlaying, currentMedia });
                isSeekingRef.current = true;
                setIsPlaying(newIsPlaying);
                setCurrentMedia(currentMedia);
                if (currentMedia) {
                    const timeSinceAction = (Date.now() - actionTime) / 1000;
                    const adjustedSeek = newIsPlaying ? newSeekTime + timeSinceAction : newSeekTime;
                    handleMediaChange(currentMedia, newIsPlaying, adjustedSeek);
                }
                setTimeout(() => { isSeekingRef.current = false; }, 500);
            });

            socket.on('updateUserList', (userNames) => setUsersInRoom(userNames || []));
            socket.on('typingUpdate', (typingUserNames) => {
                const otherTypingUsers = typingUserNames.filter(name => name !== parsedData?.name);
                setTypingUsers(otherTypingUsers);
            });

            return () => {
                console.log('🧹 Cleaning up Player component');
                
                // ✅ Stop radio audio
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = '';
                    audioRef.current.load();
                }
                
                if (socket) {
                    socket.off();
                    socket.disconnect();
                }
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                }
                if (mobileHlsRef.current) {
                    mobileHlsRef.current.destroy();
                }
            };

        } catch (error) {
            console.error("Error initializing player:", error);
            notify(`Initialization Error: ${error.message}`, { icon: "❌", duration: 5000 });
            navigate('/');
            setInitialLoading(false);
        }

    }, [roomCode, navigate, notify, loadTVChannels, loadRadioStations, playNotificationSound]);

    // ✅ FIXED: Radio always stops before switching media
    const handleMediaChange = useCallback((media, playing, seekTime, startTime) => {
        if (!media) return;

        console.log("🎬 handleMediaChange:", media.type, media.title, "Playing:", playing);

        // ✅ ALWAYS STOP RADIO FIRST (regardless of previous media type)
        const audio = audioRef.current;
        if (audio) {
            console.log("🛑 Stopping any existing radio audio");
            audio.pause();
            audio.src = '';
            audio.load();
        }

        // Destroy HLS instances
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
        if (mobileHlsRef.current) {
            mobileHlsRef.current.destroy();
            mobileHlsRef.current = null;
        }

        if (media.type === 'youtube') {
            // Sync YouTube player with muting for mobile to prevent echo
            const syncYouTubePlayer = (playerRefObj, shouldMute = false) => {
                if (!playerRefObj?.current?.internalPlayer) return;
                
                try {
                    const player = playerRefObj.current.internalPlayer;
                    
                    if (shouldMute) {
                        player.mute();
                    } else {
                        player.unMute();
                    }
                    
                    if (playing && startTime) {
                        const currentTime = Date.now();
                        const timeElapsed = (currentTime - startTime) / 1000;
                        const calculatedSeek = seekTime + timeElapsed;
                        player.seekTo(calculatedSeek, true);
                        setTimeout(() => {
                            player.playVideo();
                        }, 200);
                    } else {
                        player.seekTo(seekTime || 0, true);
                        setTimeout(() => {
                            if (playing) {
                                player.playVideo();
                            } else {
                                player.pauseVideo();
                            }
                        }, 200);
                    }
                } catch (err) {
                    console.error('YouTube player sync error:', err);
                }
            };

            syncYouTubePlayer(playerRef, false);
            setTimeout(() => {
                syncYouTubePlayer(mobilePlayerRef, true);
            }, 300);

        } else if (media.type === 'tv') {
            const setupTVPlayer = (videoElement, hlsRefObj) => {
                if (!videoElement) return;

                if (Hls.isSupported()) {
                    const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                    hlsRefObj.current = hls;
                    hls.loadSource(media.url);
                    hls.attachMedia(videoElement);

                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        console.log('✅ HLS TV manifest parsed');
                        if (playing) {
                            videoElement.play().catch(err => console.error('TV play error:', err));
                        }
                    });

                    hls.on(Hls.Events.ERROR, (event, data) => {
                        console.error('❌ HLS TV error:', data);
                        if (data.fatal) {
                            notify('TV stream error. Trying to recover...', { icon: '⚠️' });
                        }
                    });
                } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                    videoElement.src = media.url;
                    if (playing) {
                        videoElement.play().catch(err => console.error('TV play error:', err));
                    }
                }
            };

            setupTVPlayer(videoRef.current, hlsRef);
            setTimeout(() => {
                setupTVPlayer(mobileVideoRef.current, mobileHlsRef);
            }, 300);

        } else if (media.type === 'radio') {
            if (!audio) {
                console.error("❌ Audio ref is null!");
                return;
            }

            console.log("📻 Setting up NEW radio:", media.url);
            
            // Already cleared above, now set new source
            audio.src = media.url;
            audio.load();
            
            if (playing) {
                setTimeout(() => {
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                console.log("✅ Radio playing successfully!");
                                setIsPlaying(true);
                            })
                            .catch(err => {
                                console.error('❌ Radio play error:', err);
                                notify('Radio failed to play. Try another station.', { icon: '⚠️' });
                            });
                    }
                }, 200);
            } else {
                audio.pause();
                setIsPlaying(false);
            }
        }
    }, [notify]);

    const onPlayerReady = useCallback((event) => {
        console.log("✅ YouTube Player ready");
    }, []);

    const onPlayerStateChange = useCallback((event) => {
        if (isSeekingRef.current) return;

        try {
            const player = event.target;
            const currentState = player.getPlayerState();
            const currentTime = player.getCurrentTime();
            let currentIsPlaying = false;

            if (currentState === 1) {
                currentIsPlaying = true;
            } else if (currentState === 2) {
                currentIsPlaying = false;
            } else {
                return;
            }

            if (currentIsPlaying !== isPlaying) {
                console.log(`⏯️ Player state changed: ${currentIsPlaying ? 'Play' : 'Pause'}`);
                socket?.emit('playbackAction', { isPlaying: currentIsPlaying, currentTime, currentMedia });
            }
        } catch (err) {
            console.error('YouTube state change error:', err);
        }
    }, [isPlaying, currentMedia]);

    const onPlayerError = useCallback((event) => {
        console.error("❌ YouTube Player Error:", event.data);
        notify(`Player error. Try another video.`, { icon: "⚠️" });
    }, [notify]);

    const handleSearch = useCallback(async (e) => {
        if (e) e.preventDefault();
        const searchTerm = searchQuery.trim();
        if (!searchTerm) return;

        setSearchLoading(true);
        setErrorMessage(null);
        setSearchResults([]);

        try {
            let API_KEYS=["AIzaSyD6qAtIRV4stj27ziUHN8LeKTYdBPrJzZ0","AIzaSyDHjHJPKXM0tJFVCN1j0wH_cFGyprgcpwc","AIzaSyB-4iNzGs-5_qnJzasVJ2TYIvkI-GFLHRE","AIzaSyBQ2doMsFwD6TitN_VWIH7cEhtc_RkR-wo","AIzaSyD1IpLzlnCsLfo4sSMp-p9Okq7qzfPGOi8","AIzaSyCw-58Wv7HBwUSFeAKCMvylVG3EDdR3ZPQ","AIzaSyCbyQI2rLDhj_rO4p6j0l9QAtlkUwy9nuA","AIzaSyA0RfAKJPYipj75a6oIQ0tmFWs6i20tUDg","AIzaSyCamXR2_AWwutLAx16Wha2jcP7DnSdg1i4","AIzaSyBO944zaSSKHiNkiGNO5xOP5GoBDwK3f7I"];
            const apiKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];

            const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
                params: {
                    part: "snippet",
                    maxResults: 2,
                    q: searchTerm,
                    type: "video",
                    key: apiKey,
                },
            });

            const fetchedVideos = response.data.items;
            if (!fetchedVideos || fetchedVideos.length === 0) {
                notify("No videos found 🤷", { icon: "🔍" });
            }
            setSearchResults(fetchedVideos);

        } catch (err) {
            console.error("Error fetching YouTube:", err);
            let errMsg = "Failed to search YouTube.";
            if (err.response?.data?.error?.message) {
                errMsg = `YouTube API Error: ${err.response.data.error.message}`;
            }
            setErrorMessage(errMsg);
            notify(errMsg, { icon: "❌", duration: 4000 });
        } finally {
            setSearchLoading(false);
        }
    }, [searchQuery, notify]);

    const handlePlayRequest = useCallback((videoId, title) => {
        if (!socket || !isConnected) {
            notify("Not connected to server.", { icon: "❌" });
            return;
        }
        if (currentMedia?.videoId === videoId) {
            notify("Already playing this song 🎧", { icon: "ℹ️" });
            return;
        }
        const mediaData = { type: 'youtube', videoId, title };
        socket.emit('requestPlayMedia', mediaData, (response) => {
            if (response?.error) {
                notify(`Error: ${response.error}`, { icon: "❌" });
            } else {
                notify(`Now playing: ${title} 🎵`, { icon: "✅" });
            }
        });
        setActiveTab('chat');
    }, [socket, isConnected, currentMedia, notify]);

    const handlePlayTV = useCallback((channel) => {
        if (!socket || !isConnected) {
            notify("Not connected to server.", { icon: "❌" });
            return;
        }
        const mediaData = { type: 'tv', url: channel.url, title: channel.channelName };
        socket.emit('requestPlayMedia', mediaData, (response) => {
            if (response?.error) {
                notify(`Error: ${response.error}`, { icon: "❌" });
            } else {
                notify(`Watching: ${channel.channelName} 📺`, { icon: "✅" });
            }
        });
        setActiveTab('chat');
    }, [socket, isConnected, notify]);

    const handlePlayRadio = useCallback((station) => {
        if (!socket || !isConnected) {
            notify("Not connected to server.", { icon: "❌" });
            return;
        }
        console.log("📻 Requesting radio:", station.title, station.src);
        const mediaData = { type: 'radio', url: station.src, title: station.title };
        socket.emit('requestPlayMedia', mediaData, (response) => {
            if (response?.error) {
                notify(`Error: ${response.error}`, { icon: "❌" });
            } else {
                notify(`Tuned to: ${station.title} 📻`, { icon: "✅" });
            }
        });
        setActiveTab('chat');
    }, [socket, isConnected, notify]);

    const handleSendMessage = useCallback((e) => {
        e.preventDefault();
        const text = messageInput.trim();
        if (text && socket && isConnected) {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                socket.emit('stopTyping');
                typingTimeoutRef.current = null;
            }
            socket.emit('sendMessage', text, (response) => {
                if (response?.error) {
                    notify(`Error: ${response.error}`, { icon: "❌" });
                } else {
                    setMessageInput("");
                    setShowEmojiPicker(false);
                }
            });
        }
    }, [messageInput, socket, isConnected, notify]);

    const handleSendGif = useCallback((gifUrl) => {
        if (!socket || !isConnected) return;
        
        const gifMessage = `[GIF]${gifUrl}`;
        socket.emit('sendMessage', gifMessage, (response) => {
            if (response?.error) {
                notify(`Error: ${response.error}`, { icon: "❌" });
            } else {
                setShowGifPicker(false);
            }
        });
    }, [socket, isConnected, notify]);

    const handleDeleteMessage = useCallback((messageId) => {
        if (!socket || !isConnected) return;
        socket.emit('deleteMessage', messageId, (response) => {
            if (response?.error) {
                notify(`Error: ${response.error}`, { icon: "❌" });
            }
        });
    }, [socket, isConnected, notify]);

    const handleTogglePlayPause = useCallback(() => {
        if (!currentMedia) return;

        if (currentMedia.type === 'youtube') {
            if (!playerRef.current) return;
            try {
                const player = playerRef.current.internalPlayer;
                const playerState = player.getPlayerState();

                if (playerState === 1) {
                    player.pauseVideo();
                    if (mobilePlayerRef.current?.internalPlayer) {
                        mobilePlayerRef.current.internalPlayer.pauseVideo();
                    }
                } else {
                    player.playVideo();
                    if (mobilePlayerRef.current?.internalPlayer) {
                        mobilePlayerRef.current.internalPlayer.playVideo();
                    }
                }
            } catch (err) {
                console.error('Toggle play/pause error:', err);
            }
        } else if (currentMedia.type === 'tv') {
            const video = videoRef.current;
            if (!video) return;

            if (video.paused) {
                video.play().catch(err => console.error('Play error:', err));
                if (mobileVideoRef.current) {
                    mobileVideoRef.current.play().catch(err => console.error('Mobile play error:', err));
                }
                socket?.emit('playbackAction', { isPlaying: true, currentTime: video.currentTime, currentMedia });
            } else {
                video.pause();
                if (mobileVideoRef.current) {
                    mobileVideoRef.current.pause();
                }
                socket?.emit('playbackAction', { isPlaying: false, currentTime: video.currentTime, currentMedia });
            }
        } else if (currentMedia.type === 'radio') {
            const audio = audioRef.current;
            if (!audio) return;

            if (audio.paused) {
                audio.play()
                    .then(() => {
                        console.log("✅ Radio resumed");
                        socket?.emit('playbackAction', { isPlaying: true, currentTime: 0, currentMedia });
                    })
                    .catch(err => console.error('Play error:', err));
            } else {
                audio.pause();
                socket?.emit('playbackAction', { isPlaying: false, currentTime: 0, currentMedia });
            }
        }
    }, [currentMedia, socket]);

    const handleTyping = useCallback((e) => {
        setMessageInput(e.target.value);

        if (!socket || !isConnected) return;

        if (!typingTimeoutRef.current) {
            socket.emit('startTyping');
        } else {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stopTyping');
            typingTimeoutRef.current = null;
        }, 2000);
    }, [socket, isConnected]);

    const handleToggleVideo = useCallback(() => {
        setVideoEnabled(prev => !prev);
        notify(
            videoEnabled 
                ? "Video OFF 🔇 (Audio Only - Saving Bandwidth)" 
                : "Video ON 🎥", 
            { icon: "✅" }
        );
    }, [videoEnabled, notify]);

    const handleToggleNotifications = useCallback(() => {
        setNotificationsEnabled(prev => !prev);
        notify(
            notificationsEnabled 
                ? "Notifications OFF 🔕" 
                : "Notifications ON 🔔", 
            { icon: "✅" }
        );
    }, [notificationsEnabled, notify]);

    const onEmojiClick = useCallback((emojiData) => {
        setMessageInput(prev => prev + emojiData.emoji);
    }, []);

    // ✅ Auto-scroll to bottom on new messages
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chats]);

    if (initialLoading) {
        return (
            <div className="w-screen h-screen bg-black flex flex-col justify-center items-center text-white space-y-4">
                <img src={loadingImage} alt="Loading..." className="w-24 h-24" />
                <p className="text-lg">Connecting to room: <span className="text-green-400 font-bold">{roomCode}</span></p>
                {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
                <Toaster />
            </div>
        );
    }

    if (!isConnected && errorMessage) {
        return (
            <div className="w-screen h-screen bg-black flex flex-col justify-center items-center text-white space-y-4 p-4 text-center">
                <h2 className="text-2xl text-red-500 font-bold">Connection Failed</h2>
                <p className="text-gray-300">{errorMessage}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold">
                    Retry Connection
                </button>
                <button onClick={() => navigate('/')} className="mt-2 px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold">
                    Go Home
                </button>
                <Toaster />
            </div>
        );
    }

    return (
        <>
            <Toaster />
            <audio ref={audioRef} className="hidden" />
            
            <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl shadow-lg flex-shrink-0 border-b border-gray-700 z-50">
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <h1 className="text-base md:text-lg font-bold text-green-400 truncate">Room: {roomCode}</h1>
                        <button onClick={copyRoomCode} title="Copy Room Code" className="text-gray-400 hover:text-green-400 transition-colors">
                            <Copy size={16} className="md:w-5 md:h-5" />
                        </button>
                    </div>

                    <div className="flex items-center space-x-2 md:space-x-4">
                        {(currentMedia?.type === 'youtube' || currentMedia?.type === 'tv') && (
                            <button 
                                onClick={handleToggleVideo} 
                                title={videoEnabled ? "Turn Off Video (Audio Only)" : "Turn On Video"} 
                                className={`p-2 md:p-2 rounded-full transition-all shadow-lg border ${
                                    videoEnabled 
                                        ? 'bg-gradient-to-r from-blue-600/90 to-blue-500/90 hover:from-blue-500/90 hover:to-blue-400/90 border-blue-400' 
                                        : 'bg-gradient-to-r from-yellow-600/90 to-yellow-500/90 hover:from-yellow-500/90 hover:to-yellow-400/90 border-yellow-400'
                                } text-white backdrop-blur-sm`}
                            >
                                {videoEnabled ? <Video size={18} className="md:w-5 md:h-5" /> : <VideoOff size={18} className="md:w-5 md:h-5" />}
                            </button>
                        )}
                        <button 
                            onClick={handleToggleNotifications} 
                            title={notificationsEnabled ? "Disable Notifications" : "Enable Notifications"}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            {notificationsEnabled ? <Bell size={18} className="md:w-5 md:h-5" /> : <BellOff size={18} className="md:w-5 md:h-5" />}
                        </button>
                        <span className="text-xs md:text-sm text-gray-300 hidden sm:block">👤 {userData?.name}</span>
                        <button onClick={() => setShowUserList(true)} title="Show Users" className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors">
                            <Users size={18} className="md:w-5 md:h-5" />
                            <span className="text-xs md:text-sm font-semibold">({usersInRoom.length})</span>
                        </button>
                        <button onClick={() => navigate('/')} title="Leave Room" className="px-2 md:px-3 py-1 bg-red-600/90 hover:bg-red-500/90 backdrop-blur-sm rounded-lg font-semibold text-xs md:text-sm transition-colors">
                            Leave
                        </button>
                    </div>
                </header>

                {/* Mobile Video Player at Top */}
                {currentMedia && (
                    <div className="md:hidden relative bg-black/95 backdrop-blur-xl border-b border-gray-700 flex-shrink-0 z-40">
                        <div className="p-2 flex items-center justify-center">
                            <div className="w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden relative flex items-center justify-center shadow-2xl border border-gray-700">
                                {currentMedia.type === 'youtube' && currentMedia.videoId && videoEnabled && (
                                    <div className="w-full h-full flex items-center justify-center bg-black">
                                        <YouTube
                                            ref={mobilePlayerRef}
                                            videoId={currentMedia.videoId}
                                            opts={{ 
                                                width: '100%',
                                                height: '100%',
                                                playerVars: { 
                                                    autoplay: 1,
                                                    controls: 0, 
                                                    modestbranding: 1,
                                                    rel: 0,
                                                    enablejsapi: 1,
                                                    disablekb: 1,
                                                    fs: 0,
                                                    iv_load_policy: 3,
                                                    mute: 1
                                                } 
                                            }}
                                            onReady={onPlayerReady}
                                            className="w-full h-full"
                                            style={{ 
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%'
                                            }}
                                        />
                                    </div>
                                )}
                                {currentMedia.type === 'youtube' && currentMedia.videoId && !videoEnabled && (
                                    <div className="w-full h-full bg-gradient-to-br from-red-900/90 via-black to-black backdrop-blur-sm flex flex-col items-center justify-center">
                                        <div className="w-32 h-32 rounded-full bg-slate-400/10 backdrop-blur-3xl flex justify-center items-center mb-3 animate-pulse" style={{ boxShadow: `0 0 30px 2px ${borderColor}` }}>
                                            <img src={loadingImage} alt="Audio Only" className="w-20 h-20" />
                                        </div>
                                        <p className="text-white text-sm font-bold">🎵 Audio Only</p>
                                        <p className="text-gray-400 text-xs mt-1">Saving bandwidth</p>
                                        <div className="hidden">
                                            <YouTube
                                                ref={mobilePlayerRef}
                                                videoId={currentMedia.videoId}
                                                opts={{ height: '0', width: '0', playerVars: { autoplay: 1, controls: 0, mute: 1 } }}
                                                onReady={onPlayerReady}
                                            />
                                        </div>
                                    </div>
                                )}
                                {currentMedia.type === 'tv' && currentMedia.url && videoEnabled && (
                                    <video
                                        ref={mobileVideoRef}
                                        className="w-full h-full object-contain"
                                        controls={false}
                                        autoPlay
                                    />
                                )}
                                {currentMedia.type === 'tv' && currentMedia.url && !videoEnabled && (
                                    <div className="w-full h-full bg-gradient-to-br from-green-900/90 via-black to-black backdrop-blur-sm flex flex-col items-center justify-center">
                                        <div className="w-32 h-32 rounded-full bg-slate-400/10 backdrop-blur-3xl flex justify-center items-center mb-3" style={{ boxShadow: `0 0 25px 2px ${borderColor}` }}>
                                            <img src={loadingImage} alt="TV Audio" className="w-20 h-20" />
                                        </div>
                                        <p className="text-gray-300 text-sm font-semibold">📺 Audio Only</p>
                                        <p className="text-gray-500 text-xs mt-1">Saving bandwidth</p>
                                    </div>
                                )}
                                {currentMedia.type === 'radio' && (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-black backdrop-blur-sm flex flex-col items-center justify-center">
                                        <div className="w-32 h-32 rounded-full bg-slate-400/10 backdrop-blur-3xl flex justify-center items-center mb-3 animate-pulse" style={{ boxShadow: `0 0 30px 2px ${borderColor}` }}>
                                            <img src={loadingImage} alt="Radio" className="w-20 h-20" />
                                        </div>
                                        <p className="text-white text-sm font-bold truncate max-w-full px-4">{currentMedia.title}</p>
                                        <p className="text-blue-400 text-xs flex items-center mt-1">
                                            📻 Live Radio <span className="animate-ping ml-2 text-red-500">🔴</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Tab Navigation */}
                <div className="md:hidden flex justify-around items-center bg-gray-800/95 backdrop-blur-xl shadow-md overflow-x-auto border-b border-gray-700 flex-shrink-0">
                    {['search', 'tv', 'radio', 'chat'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-center font-semibold text-xs uppercase whitespace-nowrap transition-all ${activeTab === tab ? 'text-green-400 border-b-2 border-green-400 bg-gray-800/50' : 'text-gray-400'}`}>
                            {tab === 'tv' && <Tv size={14} className="inline mr-1" />}
                            {tab === 'radio' && <Radio size={14} className="inline mr-1" />}
                            {tab === 'search' && <Music size={14} className="inline mr-1" />}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">

                    {/* Desktop Player Column - CENTERED */}
                    <div className="hidden md:flex w-full md:w-2/3 flex-col p-4 space-y-4 bg-gradient-to-b from-gray-900/95 to-black backdrop-blur-sm relative overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${getMediaBackground(currentMedia?.type)} opacity-50 blur-3xl -z-10`}></div>
                        
                        <div className="w-full flex items-center justify-center">
                            <div className="w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative border-2 border-gray-700/50 backdrop-blur-sm flex items-center justify-center">
                                {currentMedia?.type === 'youtube' && currentMedia.videoId ? (
                                    videoEnabled ? (
                                        <div className="w-full h-full flex items-center justify-center bg-black">
                                            <YouTube
                                                ref={playerRef}
                                                videoId={currentMedia.videoId}
                                                opts={{ 
                                                    width: '100%',
                                                    height: '100%',
                                                    playerVars: { 
                                                        autoplay: 1, 
                                                        controls: 0, 
                                                        rel: 0, 
                                                        modestbranding: 1, 
                                                        enablejsapi: 1,
                                                        disablekb: 1,
                                                        fs: 0,
                                                        iv_load_policy: 3
                                                    } 
                                                }}
                                                onReady={onPlayerReady}
                                                onStateChange={onPlayerStateChange}
                                                onError={onPlayerError}
                                                className="w-full h-full"
                                                style={{ 
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%'
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col justify-center items-center bg-gradient-to-br from-red-900/90 via-black to-black backdrop-blur-sm">
                                            <div className="w-64 h-64 rounded-full bg-slate-400/10 backdrop-blur-3xl flex justify-center items-center mb-6 animate-pulse" style={{ boxShadow: `0 0 40px 3px ${borderColor}` }}>
                                                <img src={loadingImage} alt="Audio Only" className="w-40 h-40" />
                                            </div>
                                            <p className="text-2xl font-bold text-white mb-2">🎵 Audio Only Mode</p>
                                            <p className="text-gray-400 text-sm">Video disabled to save bandwidth</p>
                                            <div className="mt-6 w-full flex justify-center">
                                                <RandomBeatVisualizer data={borderColor} />
                                            </div>
                                            <div className="hidden">
                                                <YouTube
                                                    ref={playerRef}
                                                    videoId={currentMedia.videoId}
                                                    opts={{ height: '0', width: '0', playerVars: { autoplay: 1, controls: 0 } }}
                                                    onReady={onPlayerReady}
                                                    onStateChange={onPlayerStateChange}
                                                    onError={onPlayerError}
                                                />
                                            </div>
                                        </div>
                                    )
                                ) : currentMedia?.type === 'tv' && currentMedia.url ? (
                                    <div className="relative w-full h-full">
                                        <video ref={videoRef} className="w-full h-full object-contain" controls={false} autoPlay style={{ display: videoEnabled ? 'block' : 'none' }} />
                                        {!videoEnabled && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-900/90 via-black to-black backdrop-blur-sm">
                                                <div className="w-64 h-64 rounded-full bg-slate-400/10 backdrop-blur-3xl flex justify-center items-center mb-4" style={{ boxShadow: `0 0 30px 2px ${borderColor}` }}>
                                                    <img src={loadingImage} alt="TV Audio" className="w-32 h-32" />
                                                </div>
                                                <p className="text-gray-300 text-lg font-semibold">📺 Audio Only Mode</p>
                                                <p className="text-gray-500 text-sm mt-1">Saving bandwidth...</p>
                                                <div className="mt-4">
                                                    <RandomBeatVisualizer data={borderColor} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : currentMedia?.type === 'radio' && currentMedia.url ? (
                                    <div className="w-full h-full flex flex-col justify-center items-center bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-black backdrop-blur-sm">
                                        <div className="w-64 h-64 rounded-full bg-slate-400/10 backdrop-blur-3xl flex justify-center items-center mb-6 animate-pulse" style={{ boxShadow: `0 0 40px 3px ${borderColor}` }}>
                                            <img src={loadingImage} alt="Radio" className="w-40 h-40" />
                                        </div>
                                        <p className="text-2xl font-bold text-white mb-2">{currentMedia.title}</p>
                                        <p className="text-blue-400 flex items-center text-lg">
                                            📻 Live Radio <span className="animate-ping ml-2 text-red-500">🔴</span>
                                        </p>
                                        <div className="mt-6 w-full flex justify-center">
                                            <RandomBeatVisualizer data={borderColor} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col justify-center items-center text-gray-500 bg-gradient-to-br from-gray-900/90 to-black backdrop-blur-sm">
                                        <Music size={80} className="mb-4 text-gray-700" />
                                        <p className="text-xl font-semibold">No media playing</p>
                                        <p className="text-sm mt-2 text-gray-600">Search YouTube, TV, or Radio!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-center space-y-3 bg-gray-800/70 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50 shadow-xl">
                            <div className="text-center w-full px-2">
                                <p className="text-lg font-bold truncate text-white">{currentMedia?.title || "No Media Selected"}</p>
                                {currentMedia && (
                                    <p className="text-sm text-gray-400 mt-1">
                                        {currentMedia.type === 'youtube' && (videoEnabled ? '🎥 YouTube Video' : '🎵 YouTube Audio Only')}
                                        {currentMedia.type === 'tv' && (videoEnabled ? '📺 Live TV' : '📻 TV Audio Only')}
                                        {currentMedia.type === 'radio' && '📻 Live Radio'}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-center space-x-6 w-full">
                                <button 
                                    onClick={handleTogglePlayPause} 
                                    title={isPlaying ? "Pause" : "Play"} 
                                    className={`p-4 rounded-full transition-all shadow-xl ${currentMedia ? 'bg-gradient-to-r from-green-500/90 to-green-400/90 hover:from-green-400/90 hover:to-green-300/90 text-white backdrop-blur-sm' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`} 
                                    disabled={!currentMedia}
                                >
                                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Column */}
                    <div className="flex w-full md:w-1/3 flex-col overflow-hidden border-l border-gray-800/50 bg-gradient-to-b from-gray-900/95 to-black backdrop-blur-sm relative">
                        <div className={`absolute inset-0 bg-gradient-to-br ${getMediaBackground(currentMedia?.type)} opacity-30 blur-3xl -z-10`}></div>
                        
                        <div className="hidden md:flex justify-around bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl shadow-md border-b border-gray-700 z-30 flex-shrink-0">
                            {['search', 'tv', 'radio', 'chat'].map(tab => (
                                <button 
                                    key={tab} 
                                    onClick={() => setActiveTab(tab)} 
                                    className={`flex-1 py-4 text-center font-semibold text-sm uppercase transition-all ${
                                        activeTab === tab 
                                            ? 'text-green-400 border-b-2 border-green-400 bg-gray-800/50' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {tab === 'tv' && <Tv size={16} className="inline mr-1" />}
                                    {tab === 'radio' && <Radio size={16} className="inline mr-1" />}
                                    {tab === 'search' && <Music size={16} className="inline mr-1" />}
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="flex-grow flex flex-col relative overflow-hidden z-10">
                            {activeTab === 'search' && (
                                <div className="flex flex-col h-full bg-black/70 backdrop-blur-xl overflow-hidden">
                                    <form onSubmit={handleSearch} className="p-3 flex items-center space-x-2 bg-black/90 backdrop-blur-xl z-20 border-b border-gray-800 flex-shrink-0">
                                        <input 
                                            type="text" 
                                            value={searchQuery} 
                                            onChange={(e) => setSearchQuery(e.target.value)} 
                                            placeholder="Search YouTube..." 
                                            className="flex-grow p-3 bg-gray-800/90 backdrop-blur-sm text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500 border border-gray-700" 
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={searchLoading || !searchQuery} 
                                            className="px-4 py-3 bg-gradient-to-r from-green-600/90 to-green-500/90 hover:from-green-500/90 hover:to-green-400/90 backdrop-blur-sm rounded-lg disabled:opacity-50 text-sm font-semibold shadow-lg flex-shrink-0"
                                        >
                                            {searchLoading ? "..." : "Search"}
                                        </button>
                                    </form>
                                    {errorMessage && !searchLoading && (
                                        <p className="text-red-500 p-3 text-center text-sm">{errorMessage}</p>
                                    )}
                                    {searchLoading && (
                                        <div className="flex justify-center items-center p-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                                        </div>
                                    )}
                                    <div className="flex-grow overflow-y-auto p-2 space-y-2">
                                        {!searchLoading && searchResults.length === 0 && !errorMessage && (
                                            <p className="text-gray-500 text-center pt-10">🔍 Search for videos (Max 2 results)</p>
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

                            {activeTab === 'tv' && (
                                <div className="flex flex-col h-full bg-black/70 backdrop-blur-xl overflow-hidden">
                                    <div className="p-3 bg-black/90 backdrop-blur-xl z-20 border-b border-gray-800 flex-shrink-0">
                                        <h3 className="text-lg font-bold flex items-center">
                                            <Tv size={20} className="mr-2 text-green-400 flex-shrink-0" /> TV Channels
                                        </h3>
                                    </div>
                                    {tvLoading && (
                                        <div className="flex justify-center items-center p-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                                        </div>
                                    )}
                                    <div className="flex-grow overflow-y-auto p-2 space-y-2">
                                        {!tvLoading && tvChannels.length === 0 && (
                                            <p className="text-gray-500 text-center pt-10">📺 No channels</p>
                                        )}
                                        {tvChannels.map((channel, idx) => (
                                            <TVChannelItem 
                                                key={idx} 
                                                channel={channel} 
                                                onPlayRequest={handlePlayTV} 
                                                isActive={currentMedia?.type === 'tv' && currentMedia?.url === channel.url} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'radio' && (
                                <div className="flex flex-col h-full bg-black/70 backdrop-blur-xl overflow-hidden">
                                    <div className="p-3 bg-black/90 backdrop-blur-xl z-20 border-b border-gray-800 flex-shrink-0">
                                        <h3 className="text-lg font-bold flex items-center">
                                            <Radio size={20} className="mr-2 text-blue-400 flex-shrink-0" /> Radio Stations
                                        </h3>
                                    </div>
                                    {radioLoading && (
                                        <div className="flex justify-center items-center p-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                        </div>
                                    )}
                                    <div className="flex-grow overflow-y-auto p-2 space-y-2">
                                        {!radioLoading && radioStations.length === 0 && (
                                            <p className="text-gray-500 text-center pt-10">📻 No stations</p>
                                        )}
                                        {radioStations.map((station, idx) => (
                                            <RadioStationItem 
                                                key={idx} 
                                                station={station} 
                                                onPlayRequest={handlePlayRadio} 
                                                isActive={currentMedia?.type === 'radio' && currentMedia?.url === station.src} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'chat' && (
                                <div className="flex flex-col h-full relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black/95 backdrop-blur-2xl z-10"></div>

                                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3 relative z-20">
                                        {chats.map((item, index) => {
                                            const key = item.id || `msg-${index}`;
                                            
                                            if (item.text?.startsWith('[GIF]')) {
                                                const gifUrl = item.text.replace('[GIF]', '');
                                                if (item.user?.toLowerCase() === userData?.name?.toLowerCase()) {
                                                    return (
                                                        <div key={key} className="flex justify-end">
                                                            <div className="bg-green-600/90 backdrop-blur-sm rounded-lg p-2 max-w-xs">
                                                                <img src={gifUrl} alt="GIF" className="rounded-lg max-w-full" />
                                                                <p className="text-xs text-green-200 mt-1">{getFormattedTime()}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div key={key} className="flex justify-start">
                                                            <div className="bg-gray-700/90 backdrop-blur-sm rounded-lg p-2 max-w-xs">
                                                                <p className="text-xs text-gray-400 mb-1">{item.user}</p>
                                                                <img src={gifUrl} alt="GIF" className="rounded-lg max-w-full" />
                                                                <p className="text-xs text-gray-400 mt-1">{getFormattedTime()}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            }
                                            
                                            if (item.user?.toLowerCase() === 'admin') {
                                                return <AdminText key={key} id={item.id} text={item.text} />;
                                            } else if (item.user?.toLowerCase() === userData?.name?.toLowerCase()) {
                                                return <MyText key={key} id={item.id} text={item.text} name={item.user} time={getFormattedTime()} showDelete={true} onDelete={() => handleDeleteMessage(item.id)} />;
                                            } else {
                                                return <HerText key={key} id={item.id} text={item.text} name={item.user} time={getFormattedTime()} />;
                                            }
                                        })}
                                    </div>

                                    <div className="h-6 px-3 bg-black/80 backdrop-blur-xl text-xs text-blue-400 italic flex items-center border-t border-gray-800/50 relative z-20 flex-shrink-0">
                                        {typingUsers.length > 0 && (
                                            <span className="animate-pulse">
                                                ✍️ {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                                            </span>
                                        )}
                                    </div>

                                    <div className="relative z-30">
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-16 left-0 z-50">
                                                <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
                                            </div>
                                        )}
                                        
                                        {showGifPicker && (
                                            <GifPicker onSelect={handleSendGif} onClose={() => setShowGifPicker(false)} />
                                        )}

                                        <form 
                                            onSubmit={handleSendMessage} 
                                            className="p-3 flex items-center space-x-2 bg-black/95 backdrop-blur-2xl border-t border-gray-700/50 flex-shrink-0"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowEmojiPicker(!showEmojiPicker);
                                                    setShowGifPicker(false);
                                                }}
                                                className="p-2 text-gray-400 hover:text-yellow-400 transition-colors flex-shrink-0"
                                                title="Add Emoji"
                                            >
                                                <Smile size={22} className="md:w-6 md:h-6" />
                                            </button>
                                            
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowGifPicker(!showGifPicker);
                                                    setShowEmojiPicker(false);
                                                }}
                                                className="p-2 text-gray-400 hover:text-blue-400 transition-colors flex-shrink-0"
                                                title="Send GIF"
                                            >
                                                <ImageIcon size={22} className="md:w-6 md:h-6" />
                                            </button>
                                            
                                            <input 
                                                type="text" 
                                                value={messageInput} 
                                                onChange={handleTyping} 
                                                placeholder="Type a message..." 
                                                className="flex-1 p-2 md:p-3 bg-gray-800/95 backdrop-blur-xl text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400 border border-gray-600 text-sm md:text-base" 
                                                maxLength={200} 
                                            />
                                            <button 
                                                type="submit" 
                                                disabled={!messageInput || !isConnected} 
                                                className="p-2 md:p-3 bg-gradient-to-r from-green-600/90 to-green-500/90 hover:from-green-500/90 hover:to-green-400/90 backdrop-blur-sm rounded-lg disabled:opacity-50 shadow-lg transition-all flex-shrink-0"
                                            >
                                                <SendHorizontal size={18} className="md:w-5 md:h-5" />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showUserList && <UserListPopup users={usersInRoom} onClose={() => setShowUserList(false)} />}
        </>
    );
};

export default Player;
