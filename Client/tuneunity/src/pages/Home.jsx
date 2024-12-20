import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import { Navigate } from 'react-router-dom';
import tuneunitybg from '../assets/tuneunitybg.jpg';
import { X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import loading_groic from '../assets/loading_groic.gif';
import { setId } from '../store';
import { nanoid } from 'nanoid';
import { useNavigate } from 'react-router-dom';
let socket;
let id;
export const Home = () => {
  const navigate = useNavigate();
  const [redirect, setRedirect] = useState(false);
  const [downbar1, setDownbar1] = useState(false);
  const [loading, setLoading] = useState(true);

  const idref = useRef(null);
  const userData = JSON.parse(localStorage.getItem('userdata'));

  const notify = (message, icon = "😊") =>
    toast(message, {
      position: 'top-center',
      icon,
    });

  const handleDownBar1 = () => {
    setDownbar1(!downbar1);
  };

  const handleJoin = () => {
    const room = idref.current.value.trim();
    if (!room) {
      alert("Please enter a valid room code.");
      return;
    }
    setId(room);
    navigate('/player', { state: { propValue: room } });
  }
  const handleCreate=()=>{
       id=nanoid(5).toString();
       navigate('/player', { state: { propValue: id } });
  }

  useEffect(() => {
    setTimeout(() => {
      notify("You're using the beta version of TuneUnity🎉❤️. Report issues at support.tuneunity@gmail.com");
      notify("Hear songs together🫂", "❤️");
      setLoading(false);
    }, 3000);
  }, []);

  if(redirect) 
  {
     return <Navigate to="/player" state={{ id }} />;
  }
  return (
    <>
      <Toaster />
      {loading ? (
        <div className="w-screen h-screen bg-black flex justify-center items-center">
          <img src={loading_groic} alt="Loading..." />
        </div>
      ) : (
        <>
          <Navbar />
          <div className="w-screen h-screen bg-black flex flex-col">
            <div className="w-screen flex space-x-5 justify-center h-28">
              <div
                 onClick={handleCreate}
                className="font-semibold bg-white text-black w-[45%] h-14 rounded-sm flex justify-center items-center"
              >
                New Room
              </div>
              <div
                className="font-semibold text-white border border-white w-[45%] h-14 rounded-sm flex justify-center items-center"
                onClick={handleDownBar1}
              >
                Join with code
              </div>
            </div>
            <div className="w-screen h-[500%] flex flex-col space-y-5 justify-center items-center">
              <img className="w-[300px] h-[300px]" src={tuneunitybg} alt="Tune Unity Background" />
              <p className="font-bold text-2xl text-white">Get a Link That You Can Share</p>
              <div className="w-full flex justify-center flex-col items-center">
                <p className="font-extralight text-white">Tap New Room to get a link that</p>
                <p className="font-extralight text-white">you can share with people you want to listen to songs with.</p>
              </div>
            </div>
          </div>
          {downbar1 && (
            <div className="w-screen h-[50%] bg-[#121212] fixed bottom-0 rounded-xl">
              <div className="w-full h-16 flex justify-between items-center">
                <div className="ml-5">
                  <p className="text-white font-semibold text-2xl">Join with Code</p>
                </div>
                <div className="mr-5" onClick={handleDownBar1}>
                  <X color="white" />
                </div>
              </div>
              <div className="w-screen flex flex-col items-center space-y-5 mt-5">
                <input
                  type="text"
                  className="w-[70%] p-3 bg-gray-800 text-white rounded-md"
                  ref={idref}
                  placeholder="Enter Code"
                />
                <div
                  className="text-white font-semibold text-lg bg-blue-600 p-2 rounded-md cursor-pointer"
                  onClick={handleJoin}
                >
                  Join
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Home;
