import React from 'react'

const MyText = (props) => {
  return (
    <div className='w-full h-auto flex text-white flex flex-col items-end'>
        <div className='w-[60%]  bg-[#125838] pl-3 pr-3 pt-2 pb-2 m-2 rounded-md'>
          <div className='w-full flex justify-start text-white font-bold'>Me</div>
           <p className=''>{props.text}</p>
        <p className='w-full flex justify-end'>{props.time}</p>
        </div>
    </div>
  )
}

export default MyText