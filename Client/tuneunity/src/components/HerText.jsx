import React from 'react'

const HerText = (props) => {
  return (
    <div className='w-full h-auto flex text-white flex flex-col items'>
        <div className='w-[60%] bg-[#252323] pl-3 pr-3 pt-2 pb-2 m-2 rounded-md text-white'>
          <div className='w-full flex justify-start font-light text-green-500'>{props.name}</div>
           <p className=''>{props.text}</p>
        <p className='w-full flex justify-end'>{props.time}</p>
        </div>
    </div>
  )
}

export default HerText