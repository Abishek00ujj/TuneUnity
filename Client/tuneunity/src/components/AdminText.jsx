import React from 'react'

const AdminText = (props) => {
  return (
    <div className='w-full h-auto flex text-white flex flex-col items-center'>
        <div className='w-[60%] bg-[#252323] pl-3 pr-3 pt-2 pb-2 m-2 rounded-md'>
          <div className='w-full flex justify-center font-light text-red-500'>{props.text}</div>
        </div>
    </div>
  )
}

export default AdminText