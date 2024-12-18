import React from 'react'
import {PartyPopper,Share2,DoorClosed} from 'lucide-react';
import logogroic from '../assets/logo-groic.png'
import {Link} from 'react-router-dom'
export const PlayerNavbar = () => {
  const data=localStorage.getItem('userdata');
  const userData=JSON.parse(data);
  return (
    <div className='w-screen h-20 bg-black flex justify-between items-center'>
        <div className='w-[100px]'> 
            <img src={logogroic} alt="" />
        </div>
        <div className='flex flex-col justify-center items-center'>
            <p className='text-slate-500'>Created by</p>
            <p className='text-white font-semibold'>{userData.name}</p>
        </div>
        <div className='flex space-x-5 p-2'>
        <div className='bg-white rounded-xl p-3'><Share2/></div>
        <Link to='/'><div className='bg-red-600 rounded-xl p-3'><DoorClosed color='white'/></div></Link>
        </div>
    </div>
  )
}

export default PlayerNavbar