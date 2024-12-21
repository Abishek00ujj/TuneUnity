import React from 'react'

const Information = () => {
  return (
    <>
     <div className='w-full flex flex-col justify-center items-center'>
     <div className='w-[80%] flex flex-col justify-start bg-[#252323] p-3 rounded-lg'>
        <div className='w-full flex justify-start'>
            <p className='font-semibold text-white'>Keyboard shortcuts</p>
        </div>
        <div>
            <p className='font-semibold text-white'>
                Type !songname in chat to play the song to room.
            </p>
        </div>
        <div className='w-full flex justify-between'>
            <p className='font-semibold text-white'>
                eg. !minnale
            </p>
            <p className='text-green-400 font-bold'>
                @SyncTogether❤️
            </p>
        </div>
     </div>
     </div>
    </>
  )
}

export default Information