import React from 'react'
import {Settings} from 'lucide-react'
export const Navbar = () => {
    const hour = new Date().getHours();
const welcomeTypes = ["Good Morning", "Good Afternoon", "Good Evening"];
let welcomeText = "";
          if (hour < 12)
             welcomeText = welcomeTypes[0];
          else if (hour < 18) 
            welcomeText = welcomeTypes[1];
          else welcomeText = welcomeTypes[2];
    console.log(welcomeText);
  return (
    <>
     <div className='w-screen h-20 bg-black flex justify-between items-center'>
        <div>
            <p className='text-2xl text-white font-bold ml-5'>{welcomeText}</p>
        </div>
        <div>
            <div className='mr-5'><Settings color='white' size={30}/></div>
        </div>
     </div>
    </>
  )
}

export default Navbar