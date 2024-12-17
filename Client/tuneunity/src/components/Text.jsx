import React from 'react'

const Text = () => {
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
  return (
    <div className='w-full h-auto flex text-white flex flex-col items-end'>
        <div className='w-[60%] bg-[#252323] p-3 m-5 rounded-md'>
        <p className=''>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Dicta veritatis quis magnam eos commodi officiis accusantium quasi molestias quas fugit! Quae ipsum quo fugiat explicabo? Officiis nemo deserunt ex nesciunt!</p>
        <p className='w-full flex justify-end'>{getFormattedTime()}</p>
        </div>
    </div>

  )
}

export default Text