import React from 'react'
import Player from '../components/Player'
import { useState } from 'react'
import {Link} from 'react-router-dom'
const Home = () => {
    const [Join,setJoin]=useState(true);
    const Handle=()=>{
        if(Join)
        {
            setJoin(false);
        }
        else{
            setJoin(true);
        }
        if(Create)
        {
            SetCreate(false);
        }
        else
        {
            SetCreate
        }
    }
  return (
    <div className='w-screen h-screen bg-black flex justify-center items-center'>
        {
            Join?(
              <>
              <div className='w-[500px] h-[300px] text-white rounded-lg backdrop-blur-3xl'>
             <div className='w-full h-[30%]  flex justify-center items-center'>
                  <p className='text-white font-bold text-3xl'>Welcome to TuneUnity!🎵🎧</p>
             </div>
             <div className='w-full h-[50%] flex justify-center items-center gap-5'>
             <button className='bg-green-400 text-black pl-5 pr-5 pt-3 pb-3' onClick={Handle}>Join room</button>
                <button className='bg-green-400 text-black pl-5 pr-5 pt-3 pb-3' onClick={Handle}>Create room</button>
             </div>
        </div>
              </>
            ):(
                <>
              <div className='w-[500px] h-[300px] text-white rounded-lg backdrop-blur-3xl'>
             <div className='w-full h-[30%]  flex justify-center items-center'>
                  <p className='text-white font-bold text-3xl'>Welcome to TuneUnity!🎵🎧</p>
             </div>
             <div className='w-full h-[50%] flex flex-col justify-center items-center gap-5'>
                 <input type="text" name="" id="" className='w-[300px] h-16 text-black p-5' placeholder='Room code'  />
             </div>
             <div className='w-full flex justify-center'>
             <Link to='/player'> <button className='bg-green-400 font-bold text-black pl-5 pr-5 pt-3 pb-3'>Sync now!</button></Link>
             </div>
             <div className='w-full flex justify-end'>
                    <p className='text-white' onClick={Handle}>Create a new room?</p>
                 </div>
        </div>
              </>
            )
      }
    </div>
  )
}

export default Home