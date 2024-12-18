import React, { useState } from 'react'
import {PartyPopper,Share2,DoorClosed} from 'lucide-react';
import logogroic from '../assets/logo-groic.png'
import {Link} from 'react-router-dom'
export const PlayerNavbar = (props) => {
  const data=localStorage.getItem('userdata');
  const userData=JSON.parse(data);
  const [down,setDown]=useState(false);
  const handleShare=()=>{
     setDown(!down);
  }
  return (
    <>
    <div className='w-screen h-20 bg-black flex justify-between items-center'>
        <div className='w-[100px]'> 
            <img src={logogroic} alt="" />
        </div>
        <div className='flex flex-col justify-center items-center'>
            <p className='text-slate-500'>Created by</p>
            <p className='text-white font-semibold'>{userData.name}</p>
        </div>
        <div className='flex space-x-5 p-2'>
        <div className='bg-white rounded-xl p-3' onClick={handleShare}><Share2/></div>
        <Link to='/'><div className='bg-red-600 rounded-xl p-3'><DoorClosed color='white'/></div></Link>
        </div>
    </div>
    {
      down&&(
        <>
    <div className='w-screen h-screen flex justify-center items-center backdrop-blur-3xl fixed' onClick={handleShare}>
      <div className='w-[300px] p-10 bg-black font-bold text-white flex flex-col justify-center items-center space-y-5 rounded-xl'>
          <p className='text-4xl font-bold text-red-600 w-full justify-end h-full items-start flex p-3' onClick={handleShare}> <span className=''>X</span></p>
          <p>Copy the code</p>
          <input type="text" disabled name="" id="" value={props.id} className='pl-5 pr-5 pt-3 pb-3 text-center' />
      </div>
    </div>
      
        </>
      )
    }
    </>
  )
}

export default PlayerNavbar