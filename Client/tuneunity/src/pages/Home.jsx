import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar'; // Assuming Navbar exists
import { useNavigate } from 'react-router-dom';
import tuneunitybg from '../assets/tuneunitybg.jpg'; // Make sure path is correct
import loading_groic from '../assets/loading_groic.gif'; // Make sure path is correct
import { X, User, LogOut, ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { nanoid } from 'nanoid';
// Removed setId from store, using navigate state instead as originally

export const Home = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true); // Keep loading state
    const [downbar1, setDownbar1] = useState(false); // Join modal state
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [userData, setUserData] = useState(null);
    
    const profileMenuRef = useRef(null);
    const idref = useRef(null);
    
    useEffect(() => {
        // Load user data from localStorage
        try {
            const data = localStorage.getItem('userdata');
            if (data) {
                setUserData(JSON.parse(data));
            }
        } catch (error) {
            console.error("Error loading user data:", error);
        }
        
        // Handle clicks outside of profile menu to close it
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const notify = (message, options = {}) =>
        toast(message, {
            position: 'top-center',
            ...options,
        });

    const handleDownBar1 = () => {
        setDownbar1(!downbar1);
    };

    const handleJoin = () => {
        const room = idref.current?.value?.trim();
        if (!room) {
            toast.error("Please enter a valid room code.");
            return;
        }
        // Basic validation - you might want more robust checks
        if (room.length < 3 || room.length > 10) {
             toast.error("Room code should be between 3 and 10 characters.");
             return;
        }
        // Pass room code via navigation state
        navigate(`/player/${room}`, { state: { roomCode: room } });
    };

    const handleCreate = () => {
        const newRoomId = nanoid(6); // Generate a 6-char room ID
        // Pass room code via navigation state
        navigate(`/player/${newRoomId}`, { state: { roomCode: newRoomId, isCreating: true } });
    };

    // Get user data - ensure it exists before navigating
    const ensureUserData = () => {
        const data = localStorage.getItem('userdata');
        if (!data) {
            toast.error("User data not found. Please log in again.", { id: 'userdata-error' });
            // Redirect to login or handle appropriately
            // navigate('/login'); // Example redirect
            return false;
        }
        try {
            const parsedData = JSON.parse(data);
            if (!parsedData || !parsedData.name) {
                toast.error("Invalid user data. Please log in again.", { id: 'userdata-invalid' });
                // navigate('/login');
                return false;
            }
            return parsedData;
        } catch (e) {
            toast.error("Error reading user data. Please log in again.", { id: 'userdata-parse-error' });
            // navigate('/login');
            return false;
        }
    };

    // Handle user logout
    const handleLogout = () => {
        localStorage.removeItem('userdata');
        setUserData(null);
        setShowProfileMenu(false);
        toast.success("Logged out successfully");
        // Optionally navigate to login page
        navigate('/');
    };

    // Add user data check before navigating
    const checkedHandleJoin = () => {
        if (ensureUserData()) {
            handleJoin();
        }
    };

    const checkedHandleCreate = () => {
        if (ensureUserData()) {
            handleCreate();
        }
    };

    useEffect(() => {
        // Keep initial loading and notifications
        const timer = setTimeout(() => {
            // Removed beta version notification - adjust as needed
            notify("🎧 Let's listen together! 🎶", { icon: "❤️" });
            setLoading(false);
        }, 1000); // Reduced timeout

        return () => clearTimeout(timer); // Cleanup timer
    }, []);

    // Show loading indicator until useEffect finishes
    if (loading) {
        return (
            <div className="flex items-center justify-center w-screen h-screen bg-black">
                <img src={loading_groic} alt="Loading..." className="w-32 h-32" />
                <Toaster /> {/* Ensure Toaster is available during loading */}
            </div>
        );
    }

    return (
        <>
            <Toaster />
            {/* Assuming Navbar component exists and works */}
            {/* <Navbar /> */}
            <div className="flex flex-col w-screen h-screen bg-black text-white">
                {/* Navbar with Profile Button */}
                <nav className="flex items-center justify-between p-4 bg-gray-900 shadow-md">
                    <h1 className="text-2xl font-bold text-green-400">SyncTogether</h1>
                    
                    {/* Profile Button with Dropdown */}
                    <div className="relative" ref={profileMenuRef}>
                        <button 
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center space-x-1 px-3 py-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                            aria-label="Profile options"
                        >
                            <User size={18} className="text-gray-300" />
                            <span className="hidden sm:inline text-sm text-gray-300">
                                {userData?.name || "Profile"}
                            </span>
                            <ChevronDown size={16} className="text-gray-300" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg overflow-hidden z-50">
                                {userData ? (
                                    <div className="p-2 border-b border-gray-700">
                                        <p className="text-sm font-medium text-gray-300 truncate">
                                            {userData.name}
                                        </p>
                                        {userData.email && (
                                            <p className="text-xs text-gray-400 truncate">
                                                {userData.email}
                                            </p>
                                        )}
                                    </div>
                                ) : null}
                                
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-2 w-full px-4 py-3 text-sm text-white hover:bg-gray-700 transition-colors"
                                >
                                    <LogOut size={16} className="text-red-400" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </nav>

                <div className="flex justify-center w-full px-4 space-x-4 h-20 mt-8 sm:mt-12">
                    {/* Create Room Button */}
                    <button
                        onClick={checkedHandleCreate} // Use checked version
                        className="font-semibold bg-green-500 text-black w-[45%] max-w-xs h-14 rounded-lg flex justify-center items-center cursor-pointer hover:bg-green-400 transition-all duration-200 ease-in-out shadow-lg transform hover:scale-105"
                        aria-label="Create a new listening room"
                    >
                        New Room
                    </button>
                    {/* Join Room Button */}
                    <button
                        className="font-semibold text-white border-2 border-green-500 w-[45%] max-w-xs h-14 rounded-lg flex justify-center items-center cursor-pointer hover:bg-green-900 hover:border-green-400 transition-all duration-200 ease-in-out shadow-lg transform hover:scale-105"
                        onClick={handleDownBar1} // Opens the join modal
                        aria-label="Join an existing listening room with a code"
                    >
                        Join with code
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col items-center justify-center flex-grow w-full px-4 space-y-6 text-center">
                    <img className="w-48 h-48 sm:w-64 sm:h-64 mb-4 rounded-full shadow-xl border-4 border-gray-700" src={tuneunitybg} alt="SyncTogether logo" />
                    <p className="text-xl sm:text-2xl font-bold text-white">Get a Link That You Can Share</p>
                    <div className="flex flex-col items-center justify-center w-full max-w-md">
                        <p className="text-gray-300 font-light text-sm sm:text-base">
                            Tap <span className="font-semibold text-green-400">'New Room'</span> to start a listening session.
                        </p>
                        <p className="text-gray-300 font-light text-sm sm:text-base">
                            Share the code or link with friends to listen together in real-time.
                        </p>
                    </div>
                </div>
            </div>

            {/* Join with Code Modal (Downbar) */}
            {downbar1 && (
                // Added overlay for better focus
                <div className="fixed inset-0 z-40 bg-black bg-opacity-70 flex items-end justify-center" onClick={handleDownBar1}>
                    <div
                        className="w-full max-w-md h-auto bg-[#1f1f1f] fixed bottom-0 rounded-t-2xl shadow-2xl p-5 transform transition-transform duration-300 ease-out"
                        style={{ transform: downbar1 ? 'translateY(0)' : 'translateY(100%)' }}
                        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
                    >
                        <div className="flex items-center justify-between w-full pb-4 border-b border-gray-700">
                            <p className="text-xl font-semibold text-white">Join with Code</p>
                            <button
                                className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                                onClick={handleDownBar1}
                                aria-label="Close join modal"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex flex-col items-center w-full py-6 space-y-5">
                            <label htmlFor="roomCodeInput" className="sr-only">Enter Room Code</label>
                            <input
                                id="roomCodeInput"
                                type="text"
                                className="w-[80%] sm:w-[70%] p-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500 text-center"
                                ref={idref}
                                placeholder="Enter Code"
                                // Use checked version on Enter key press
                                onKeyPress={(e) => e.key === 'Enter' ? checkedHandleJoin() : null}
                                autoFocus // Focus input when modal opens
                            />
                            <button
                                className="p-3 px-10 text-lg font-semibold text-black bg-green-500 rounded-lg cursor-pointer hover:bg-green-400 transition-colors shadow-md transform hover:scale-105"
                                onClick={checkedHandleJoin} // Use checked version
                            >
                                Join Room
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Make sure to export default if this is the main export for the file route
export default Home; // Uncomment if needed by your router setup