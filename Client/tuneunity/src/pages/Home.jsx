import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar';
import tuneunitybg from '../assets/tuneunitybg.jpg';
import {X} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast';
import loading_groic from '../assets/loading_groic.gif'
const Home = () => {
  const [downbar1, setDownbar1] = useState(false);
  const notify = (message) => toast(message);
  const [Loading,SetLoading]=useState(true);
  const handleDownBar1=()=>{
    setDownbar1(!downbar1);
  }
  useEffect(()=>{
      setTimeout(()=>{
        toast("You're using the beta version of TuneUnity🎉❤️.Please report any issues you face on support.tuneunity@gmail.com");
        toast("Hear songs together❤️");
        SetLoading(false)
      },3000);
      
  },[]);
  return(
     <>
     <Toaster />
     {
        Loading?(
          <div className='w-screen h-screen bg-black flex justify-center items-center'>
                 <img src={loading_groic} alt="" />
          </div>
        ):
        (
            <>
                <Navbar/>
     <div className='w-screen h-screen bg-black flex flex-col'>
         <div className='w-screen flex space-x-5 justify-center h-28'>
            <div className='font-semibold bg-white text-black w-[45%] h-14 rounded-sm flex justify-center items-center'>New Room</div>
            <div className='font-semibold text-white border border-white w-[45%] h-14 rounded-sm flex justify-center items-center' onClick={handleDownBar1}>Join with code</div>
         </div>
         <div className='w-screen h-[500%] flex flex-col space-y-5 justify-center items-center'>
           <img className='w-[300px] h-[300px]' src={tuneunitybg} alt=""  />
           <p className='font-bold text-2xl text-white'> Get a Link That you can Share</p>
           <div className='w-full flex justify-center flex-col items-center'>
           <p className='font-extralight text-white'>Tap New Room to get a link that </p>
           <p className='font-extralight text-white'>you can share with people you want to listen songs with.</p>
           </div>
         </div>
     </div>
     {
          downbar1&&(
            <div className='w-screen h-[50%] bg-[#121212] fixed bottom-0 rounded-xl'>
            <div className='w-full h-16 flex  justify-between items-center'>
               <div className='ml-5'>
                  <p className='text-white font-semibold text-2xl'>Join with code</p>
               </div>
               <div className='mr-5 ' onClick={handleDownBar1}>
                    <X color='white'/>
               </div>
            </div>
            <div className='w-screen flex justify-center space-y-5'>
              <div className='w-[70%] justify-center items-center flex'>
                <input type="text" className='w-[90%] p-3' placeholder='Enter Code' />
              </div>
              <div className='text-white justify-center items-center flex h-20'>
               <div className='w-full h-full flex justify-center items-center'>
               <p className='text-[20px]'> Join</p>
              </div> 
              </div>
            </div>
        </div>
          )
     }
            </>
        )
     }  
     </>
  )
};

export default Home