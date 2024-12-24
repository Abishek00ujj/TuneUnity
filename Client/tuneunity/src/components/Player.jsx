import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { SkipBack, SkipForward, Play, Pause, SendHorizontal, Slice } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import loading_groic from "../assets/loading_groic.gif";
import PlayerNavbar from "./PlayerNavbar";
import Vidcomponent from "./Vidcomponent";
import io from 'socket.io-client'
import MyText from './MyText'
import HerText from "./HerText";
import AdminText from "./AdminText";
import { useLocation } from 'react-router-dom';
import Information from "./Information";
import {SongDesign} from '../components/SongDesign'
let socket;
let x1;
let dummy;
const Player = () => {
  function getFormattedTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
  
    return `${hours}:${minutes} ${ampm}`;
  }
  const location = useLocation();
  const { propValue } = location.state || {};
  console.log(propValue);
  const lastMessageRef = useRef(null);
  const data = localStorage.getItem('userdata');
  const userData = JSON.parse(data);
  console.log(userData.name);
  const [searchQuery, setSearchQuery] = useState("");
  const [videoID, setVideoID] = useState(null);
  const [videos, setVideos] = useState([]);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dummyLoading, setDummyLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setmessages] = useState([]);
  const [chatSong,SetchatSong]=useState(null);
  const [search, setsearch] = useState(true);
  const [chat, setchat] = useState(false);
  const [upnext, setupnext] = useState(false);
  const [chats,setChats]=useState([]);

   const messageRef=useRef(null);
  const selectsearch = () => {
    setsearch(true);
    setchat(false);
    setupnext(false);
  }
  const selectchat = () => {
    setsearch(false);
    setchat(true);
    setupnext(false);
  }
  const selectupnext = () => {
    setsearch(false);
    setchat(false);
    setupnext(true);
  }

  const videoRef = React.useRef(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    const searchTerm = searchQuery.trim() || chatSong;
    if (!searchTerm) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      let API_KEYS=["AIzaSyD6qAtIRV4stj27ziUHN8LeKTYdBPrJzZ0","AIzaSyDHjHJPKXM0tJFVCN1j0wH_cFGyprgcpwc","AIzaSyB-4iNzGs-5_qnJzasVJ2TYIvkI-GFLHRE","AIzaSyBQ2doMsFwD6TitN_VWIH7cEhtc_RkR-wo","AIzaSyD1IpLzlnCsLfo4sSMp-p9Okq7qzfPGOi8","AIzaSyCw-58Wv7HBwUSFeAKCMvylVG3EDdR3ZPQ","AIzaSyCbyQI2rLDhj_rO4p6j0l9QAtlkUwy9nuA","AIzaSyA0RfAKJPYipj75a6oIQ0tmFWs6i20tUDg","AIzaSyCamXR2_AWwutLAx16Wha2jcP7DnSdg1i4","AIzaSyBO944zaSSKHiNkiGNO5xOP5GoBDwK3f7I"];
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            part: "snippet",
            maxResults: 1,
            q: searchQuery||chatSong,
            type: "video",
            key: API_KEYS[Math.floor(Math.random() * 10)],
          },
        }
      );
      const fetchedVideos = response.data.items;
      if (!fetchedVideos || fetchedVideos.length === 0) {
        throw new Error("No videos found for the given search query.");
      }
      setVideos(fetchedVideos);
      setCurrentVideoIndex(0);
      sendSongId(videos[currentVideoIndex]?.id?.videoId);
      console.log(videos[currentVideoIndex]?.id?.videoId);
    } catch (err) {
      setError(err.response?.data?.error?.message || "");
      console.error("Error fetching data from YouTube API:", err);
    } finally {
      setLoading(false);
    }
  };


  const handleSkipForward = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex((prevIndex) => prevIndex + 1);
    } else {
      toast("You've reached the last video!", { icon: "🎉" });
    }
  };

  const handleSkipBackward = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex((prevIndex) => prevIndex - 1);
    }
    else {
      toast("This is First video bro!", { icon: "🎉" });
    }
  };
   const backendURL='https://tuneunity-1.onrender.com';
  // const backendURL='http://localhost:199';
   useEffect(() => {
    toast.success("Public room created");
      socket=io(backendURL);
    socket.emit('join',{name:userData.name,room:propValue},(error)=>{
         if(error)
         {
           alert(error);
         }
    });
    setLoading(false);
    setTimeout(() => {
      toast.success(`${userData.name} joined the room`, { duration: 3000, icon: "😉" });
      setDummyLoading(false);
    }, 3000);
    return ()=>{
      socket.disconnect();
      socket.off();
    }
  }, []);
  const sendMessage=(e)=>{
    e.preventDefault();
    if(messageRef.current.value==null)
    {
      return;
    }
    socket.emit('sendMessage',messageRef.current.value,()=>setmessages(""));
    messageRef.current.value='';
  }
  // let x1;
  useEffect(()=>{
       x1=0;
      socket.on('toastmessage',msg=>{
        setmessages((prevMessages) => [...prevMessages, msg]);
        toast.success(`${msg.text}`, { duration: 3000, icon: "😉" });
      });
      socket.on('message',msg=>{
        setChats((prevMessages) => [...prevMessages, msg]);
      });
      // console.log(chats);
  },[]);
  // console.log(chats);
  useEffect(() => {
    if (chats.length > 0 && chats[chats.length - 1].text.charAt(0) === '!') {
      let x = chats[chats.length - 1].text.slice(1);
      if(x==dummy)
      {
        return;
      }
      else
      {
      console.log(x);
      SetchatSong(x);
      dummy=x;
      }
    }
  }, [chats]);
  useEffect(() => {
    if (chatSong) {
      handleSearch();
    }
  }, [chatSong]);
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chats]);  
  return (
    <>
      <Toaster />
      {dummyLoading ? (
        <div className="w-screen h-screen bg-black flex justify-center items-center">
          <img src={loading_groic} alt="Loading" />
        </div>
      ) : (
        <>
          <PlayerNavbar id={propValue}/>
          <div className="w-screen h-auto flex flex-col gap-5 bg-black p-5 space-y-10">
            {loading ? (
              <div className="w-screen h-screen bg-black flex justify-center items-center">
                <div className="w-[80px] h-[80px] bg-green-400 rounded-full animate-spin">
                  <div className="w-[100px] h-[100px] bg-black rounded-full animate-spin"></div>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="text-center text-red-500">
                    <p>{error}</p>
                  </div>
                )}
                <div className="w-full max-w-4xl rounded-lg shadow-lg overflow-hidden bg-black mx-auto">
                  <div className="w-full h-full flex flex-col items-center p-4 space-y-10 rounded-2xl">
                    <iframe
                      ref={videoRef}
                      src={`https://www.youtube.com/embed/${videos[currentVideoIndex]?.id?.videoId}?autoplay=1&controls=0&rel=0&modestbranding=1&enablejsapi=1`}
                      title={videos[currentVideoIndex]?.snippet?.title}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      className="w-full h-64 sm:h-80 rounded-2xl"
                    />

                    <div className="text-white mt-2">
                      {videos[currentVideoIndex]?.snippet?.title.substring(0, 50)}
                    </div>
                    <div className="text-slate-400">
                      {videos[currentVideoIndex]?.snippet?.channelTitle}
                    </div>
                    <div className="w-full flex justify-around mt-4">
                      <button onClick={handleSkipBackward}>
                        <SkipBack size={50} color="white" />
                      </button>
                      <button
                        className="bg-white rounded-full p-3"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? (
                          <Pause size={40} color="black" />
                        ) : (
                          <Play size={40} color="black" />
                        )}
                      </button>
                      <button onClick={handleSkipForward}>
                        <SkipForward size={50} color="white" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
            <div className="w-screen h-auto rounded-xl mt-20">
              <div className="w-[90%] bg-[#121212] rounded-xl text-white">
                <div className="w-full h-16 rounded-lg flex justify-between">
                  <div className={search ? (`font-bold w-full flex justify-center items-end border-b-2 border-0 pb-3`) : (`w-full flex justify-center items-end mb-2  pb-3)`)} onClick={selectsearch}>
                    <p className=''>SEARCH</p>
                  </div>
                  <div className={chat ? (`font-bold w-full flex justify-center items-end  border-b-2 border-0 pb-3`) : (`w-full flex justify-center items-end mb-2  pb-3)`)} onClick={selectchat}>
                    <p className="font-bold">CHAT</p>
                  </div>
                  <div className={upnext ? (`font-bold w-full flex justify-center items-end  border-b-2 border-0 pb-3`) : (`w-full flex justify-center items-end mb-2  pb-3)`)} onClick={selectupnext}>
                    <p className="font-bold">UPNEXT</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-screen h-screen flex flex-col justify-center items-center bg-black">
            {
              search ? (
                <>
                  <div className="w-[90%] h-[90%] bg-[#121212] overflow-scroll overflow-y-auto mt-9 ">
                    {videos ? (
                      videos.map((item, index) => {
                        return (
                          <Vidcomponent data={item} />
                        );
                      })) : (
                      <div className="w-[90%] h-[70%] bg-[#121212] overflow-scroll overflow-y-auto flex justify-center items-center">
                        <p className="text-white font-semibold text-[10px]">Enter song name and press enter</p>
                      </div>
                    )
                    }
                  </div>
                  <div className='w-full flex flex-col justify-center items-center'>
     <div className='w-[80%] flex flex-col justify-start bg-[#252323] p-3 rounded-lg mt-3'>
        <div className='w-full flex justify-start'>
            <p className='font-semibold text-white'>Head to Chat section↗️</p>
        </div>
        <div>
            <p className='font-semibold text-white'>
                Type !songname in chat to play the song to room.
            </p>
        </div>
        <div className='w-full flex justify-between'>
            <p className='font-semibold text-white'>
                eg. !minnale
            </p>
            <p className='text-green-400 font-bold'>
                @SyncTogether❤️
            </p>
        </div>
     </div>
     </div>
                  <div className="w-full flex justify-center items-end mt-10">
                    <form
                      onSubmit={handleSearch}
                      className="w-full flex justify-center items-center gap-2 mb-4"
                    >
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for a video..."
                        className="w-1/2 p-2 text-black rounded-lg"
                        disabled
                      />
                      <button
                        type="submit"
                        className="bg-green-500 text-white px-4 py-2 rounded-lg"
                        disabled
                      >
                        Search
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                null
              )
            }
            {
              chat && (
                <>
                  <div className="w-[90%] h-[90%] bg-[#121212] flex flex-col">
                    <div className="w-[100%] h-full flex flex-col overflow-scroll overflow-y-auto">
                      {
                        // let x1=0;
                        chats&&(chats.map((item,index)=>{
                           if(index==0)
                           {
                              return <Information/>
                           }
                           if(item.user.toLowerCase()==userData.name.toLowerCase())
                           {
                            if(item.text.charAt(0) === '!')
                            {
                              return <MyText text={item.text} name={item.user} time={getFormattedTime()} song={true}/>;
                            }
                            else
                            {
                              return <MyText text={item.text} name={item.user} time={getFormattedTime()} song={false}/>;
                            }
                           }
                           else if(item.user.toLowerCase()=='admin')
                           {
                            return <AdminText text={item.text} name={item.user}/>;
                           }
                           else
                           {
                            if(item.text.charAt(0) === '!')
                              {
                                return <HerText text={item.text} name={item.user} time={getFormattedTime()} song={true}/>;
                              }
                              else
                              {
                                return <HerText text={item.text} name={item.user} time={getFormattedTime()} song={false}/>;
                              }
                            // return <HerText text={item.text} name={item.user} time={getFormattedTime()}/>;
                           }
                           x1++;
                        }))
                      }
                       <div ref={lastMessageRef}></div>
                    </div>
                    
                    <div className="w-full flex justify-items-center space-x-5 p-2">
                   <div className="w-full flex justify-center items-center space-x-2">   <input ref={messageRef} className="w-[70%] h-[50px] rounded-xl bg-[#252323] text-white flex justify-center items-center p-2" type="text" name="" id="" placeholder="Type a Message" onKeyPress={(e)=>e.key=='Enter'?sendMessage():null} />
                      <div className="w-[10%] flex justify-center items-center"><SendHorizontal size={45} fill="white" color="green" onClick={sendMessage} /></div>
                    </div> 
                    </div>
                  </div>
                </>
              )
            }
            {
              upnext && (
                <>
                  <div className="w-[90%] h-[90%] overflow-scroll overflow-y-auto bg-[#121212]">
                    {videos &&
                      videos.map((item, index) => {
                        return (
                          <Vidcomponent data={item} />
                        );
                      })}
                  </div>
                </>
              )
            }
          </div>
        </>
      )}
    </>
  );
};

export default Player;
