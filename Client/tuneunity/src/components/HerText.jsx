import React, { useState } from 'react';
import Chatbg from '../assets/chatbg.png';

const HerText = (props) => {
  const [glow,setglow]=useState(true);
  setInterval(()=>{
    setglow(!glow);
  },5000);
  return (
    <>
      {props.song ? (
        <div
          className="w-full h-auto flex text-white flex-col items-start font-bold"
        >
          <div className={glow?(`w-[60%] pl-3 pr-3 pt-2 pb-2 m-2 rounded-2xl bg-black shadow-[0_0_20px_5px_rgba(255,255,0,0.8)]`):(`w-[60%] pl-3 pr-3 pt-2 pb-2 m-2 rounded-2xl bg-black`)}
           style={{
            backgroundImage: `url(${Chatbg})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
          >
            <div className="w-full flex justify-start text-white font-bold">{props.name}</div>
            <p className="">{props.text}</p>
            <p className="w-full flex justify-end">{props.time}</p>
          </div>
        </div> 
      ) : (
        <div className="w-full h-auto flex text-white flex-col items-start">
          <div className="w-[60%] bg-[#252323] pl-3 pr-3 pt-2 pb-2 m-2 rounded-md">
            <div className="w-full flex justify-start text-white font-bold">{props.name}</div>
            <p className="">{props.text}</p>
            <p className="w-full flex justify-end">{props.time}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default HerText;
