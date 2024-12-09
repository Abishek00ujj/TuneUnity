import React, { useState } from "react";
import axios from "axios";

const Player = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  const [Loading,SetLoading]=useState(false);
  let lastSearch="";
  const handleSearch = async (e) => {
    SetLoading(true);
    e.preventDefault();
    if (searchQuery.trim() === "")    
      {
        return;
      }
      if(searchQuery.trim()==lastSearch)
        {
          return;
        }
        lastSearch=searchQuery.trim();
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
            key:"AIzaSyDf9v3RkpGo0PvUCW1b5U88y61grCrw9iE",
          },
        }
      );
      setVideos(response.data.items);
    } catch (err) {
      setError(
        err.response?.data?.error?.message || "An error occurred while fetching videos."
      );
      console.error("Error fetching data from YouTube API:", err);
    }
    finally{
      SetLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col gap-5 bg-black">
      <div className="w-screen h-auto flex justify-center items-center p-10">
        <input
          type="text"
          className="w-[400px] bg-slate-300 rounded-md p-3"
          placeholder="Song name/ Keys of song"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="w-[100px] h-10 pl-5 pr-5 pt-3 pb-3 flex justify-center items-center bg-green-400 text-white rounded-md m-10"
        >
          Search
        </button>
      </div>
      {
          Loading?(
            <>
      <div className='w-screen h-screen bg-black justify-center items-center flex'>
          <div className='w-[80px] h-[80px] bg-green-400 rounded-full animate-spin'>
              <div className='w-[100px] h-[100px] bg-black rounded-full animate-spin'></div>
          </div>
      </div>
            </>
          ):(
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
            className="w-full max-w-4xl aspect-video rounded-lg shadow-lg overflow-hidden"
          >
            <iframe
              src={`https://www.youtube.com/embed/${video.id.videoId}?rel=0&enablejsapi=1&controls=1&autoplay=1`}
              title={video.snippet.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ))}
      </div>
            </>
          )
      }
      
    </div>
  );
};

export default Player;
