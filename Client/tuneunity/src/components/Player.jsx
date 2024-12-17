import React, { useState, useEffect } from "react";
import axios from "axios";
import { SkipBack, SkipForward, Play, Pause } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import loading_groic from "../assets/loading_groic.gif";
import PlayerNavbar from "./PlayerNavbar";

const Player = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  const [Loading, SetLoading] = useState(false);
  const [dummyLoading, SetdummyLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = React.useRef(null);
  let lastSearch = "";

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    SetLoading(true);
    if (searchQuery.trim() === "" || searchQuery.trim() === lastSearch) {
      SetLoading(false);
      return;
    }
    lastSearch = searchQuery.trim();
    try {
      setError(null);
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            part: "snippet",
            maxResults: 1,
            q: searchQuery,
            type: "video",
            key: "AIzaSyDf9v3RkpGo0PvUCW1b5U88y61grCrw9iE",
          },
        }
      );
      setVideos(response.data.items);
    } catch (err) {
      setError(err.response?.data?.error?.message || "An error occurred while fetching videos.");
      console.error("Error fetching data from YouTube API:", err);
    } finally {
      SetLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  useEffect(() => {
    toast.success("Public room created");
    SetLoading(false);
    setTimeout(() => {
      toast.success("Abishek joined the room", { duration: 3000, icon: "😉" });
      SetdummyLoading(false);
    }, 3000);
  }, []);

  return (
    <>
      <Toaster />
      {dummyLoading ? (
        <div className="w-screen h-screen bg-black flex justify-center items-center">
          <img src={loading_groic} alt="Loading" />
        </div>
      ) : (
        <>
          <PlayerNavbar />
          <div className="w-screen h-screen flex flex-col gap-5 bg-black p-5">
            <form
              onSubmit={handleSearch}
              className="w-full flex justify-center items-center gap-2 mb-5"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a video..."
                className="w-1/2 p-2 text-black rounded-lg"
              />
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded-lg"
              >
                Search
              </button>
            </form>
            {Loading ? (
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
                <div className="flex flex-wrap justify-center items-center gap-5">
                  {videos.map((video) => (
                    <div
                      key={video.id.videoId}
                      className="w-full max-w-4xl rounded-lg shadow-lg overflow-hidden bg-black"
                    >
                      <div className="w-full h-full flex flex-col items-center p-4">
                        <iframe
                          ref={videoRef}
                          src={`https://www.youtube.com/embed/${video.id.videoId}?rel=0&enablejsapi=1&controls=0`}
                          title={video.snippet.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-64 sm:h-80"
                          onTimeUpdate={handleVideoTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                        />
                        <div className="text-white mt-2">
                          {video.snippet.title.substring(0, 50)}
                        </div>
                        <div className="text-slate-400">{video.snippet.channelTitle}</div>
                        <div className="w-full mt-2">
                          <input
                            type="range"
                            min="0"
                            max={duration}
                            value={currentTime}
                            onChange={(e) => (videoRef.current.currentTime = e.target.value)}
                            className="w-full"
                          />
                          <div className="flex justify-between text-white text-sm">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                        </div>
                        <div className="w-full flex justify-around mt-4">
                          <button>
                            <SkipBack size={50} color="white" />
                          </button>
                          <button
                            className="bg-white rounded-full p-3"
                            onClick={handlePlayPause}
                          >
                            {isPlaying ? (
                              <Pause size={40} color="black" />
                            ) : (
                              <Play size={40} color="black" />
                            )}
                          </button>
                          <button>
                            <SkipForward size={50} color="white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Player;
