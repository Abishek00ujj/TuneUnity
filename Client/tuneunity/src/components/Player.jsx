import React, { useState, useEffect } from "react";
import axios from "axios";
import { SkipBack, SkipForward, Play, Pause } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import loading_groic from "../assets/loading_groic.gif";
import PlayerNavbar from "./PlayerNavbar";

const Player = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dummyLoading, setDummyLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRef = React.useRef(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    if (searchQuery.trim() === "") {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            part: "snippet",
            maxResults: 20, // Fetch top 20 matches
            q: searchQuery,
            type: "video",
            key: "AIzaSyDf9v3RkpGo0PvUCW1b5U88y61grCrw9iE",
          },
        }
      );
      setVideos(response.data.items);
      setCurrentVideoIndex(0); // Reset to the first video
    } catch (err) {
      setError(err.response?.data?.error?.message || "An error occurred while fetching videos.");
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
  };

  useEffect(() => {
    toast.success("Public room created");
    setLoading(false);
    setTimeout(() => {
      toast.success("Abishek joined the room", { duration: 3000, icon: "😉" });
      setDummyLoading(false);
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
                {videos.length > 0 && (
                  <div className="w-full max-w-4xl rounded-lg shadow-lg overflow-hidden bg-black mx-auto">
                    <div className="w-full h-full flex flex-col items-center p-4">
                      <iframe
                        ref={videoRef}
                        src={`https://www.youtube.com/embed/${videos[currentVideoIndex]?.id?.videoId}?rel=0&enablejsapi=1`}
                        title={videos[currentVideoIndex]?.snippet?.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-64 sm:h-80"
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
                )}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Player;
