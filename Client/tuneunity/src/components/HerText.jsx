import React from 'react'

const HerText = (props) => {
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
    <div className='w-full h-auto flex text-white flex flex-col items'>
        <div className='w-[60%] bg-[#252323] pl-3 pr-3 pt-2 pb-2 m-2 rounded-md'>
          <div className='w-full flex justify-start font-light text-green-500'>{props.name}</div>
           <p className=''>{props.text}</p>
        <p className='w-full flex justify-end'>{getFormattedTime()}</p>
        </div>
    </div>
  )
}

export default HerText