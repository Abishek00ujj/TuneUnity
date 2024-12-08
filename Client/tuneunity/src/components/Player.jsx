import React, { useState } from "react";
import axios from "axios";

const Player = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim() === "") return;

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
            key:"AIzaSyAznuDpQN0bJz86nGA1XBLxr2Jhe8QebT8",
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
  };

  return (
    <div className="w-screen h-screen flex flex-col gap-5 bg-black">
      <div className="w-screen h-auto flex justify-center items-center p-10">
        <input
          type="text"
          className="w-[80%] h-20 bg-slate-300 rounded-md p-3"
          placeholder="Search for YouTube videos..."
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="w-[100px] h-10 bg-red-500 text-white rounded-md m-10"
        >
          Search
        </button>
      </div>
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
              src={`https://www.youtube.com/embed/${video.id.videoId}?rel=0&enablejsapi=1&controls=1`}
              title={video.snippet.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Player;
