import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Navigate } from 'react-router-dom';
import logogroic from '../assets/logo-groic.png'
export const Login = () => {
  const [redirect, setRedirect] = useState(false);

  if (redirect) {
    return <Navigate to="/home" />;
  }

  return (
    <div
      id="bg"
      className="w-screen h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('https://groic.in/obbg.webp')",
      }}
    >
      <div className="w-[400px] h-auto p-10 bg-black  rounded-lg flex flex-col backdrop-blur-3xl justify-center items-center space-y-4">
        <div className="text-white text-4xl font-semibold flex justify-start w-full">
         <div>Hey There!</div>  <div> <img className='w-[100px] h-[80px]' src={logogroic} alt="" /></div>
        </div>
        <div className="text-slate-600 font-light flex justify-start text-[20px] w-full">
          Glad to see you. Let's get started
        </div>
        <div className="p-3">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              console.log('Google Token:', credentialResponse.credential);
              if (credentialResponse.credential) {
                setRedirect(true);
              }
            }}
            onError={() => {
              console.error('Login Failed');
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
