import React from 'react'

const Vidcomponent = (props) => {
  return (
    <div className='w-full h-[60px] bg-black text-white rounded-lg flex space-x-5'>
       <div className='w-[10%] h-full rounded-lg'>
          <img src={props.data.snippet.thumbnails.high.url} alt=""  className='rounded-lg'/>
       </div>
       <div>
            <div className='w-full flex justify-start font-semibold'>
                <p>{props.data.snippet.title.substring(0,40)}</p>
            </div>
            <div className='w-full flex justify-start text-slate-500'>
               <p>{props.data.snippet.channelTitle}</p>
            </div>
       </div>
    </div>
  )
}

export default Vidcomponent