import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Navigate } from 'react-router-dom';
import logogroic from '../assets/logo-groic.png';

export const Login = () => {
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('userdata');
    if (token) {
      try {
        const parsedToken = JSON.parse(token);
        setRedirect(true);
      } catch (error) {
        console.error('Invalid JSON in localStorage:', error);
        localStorage.removeItem('userdata');
      }
    }
  }, []);

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
      <div className="w-[400px] h-auto p-10 bg-black rounded-lg flex flex-col backdrop-blur-3xl justify-center items-center space-y-4">
        <div className="text-white text-4xl font-semibold flex justify-start w-full">
          <div>Hey There!</div>
          <div>
            <img className="w-[100px] h-[80px]" src={logogroic} alt="Logo" />
          </div>
        </div>
        <div className="text-slate-600 font-light flex justify-start text-[20px] w-full">
          Glad to see you. Let's get started
        </div>
        <div className="p-3">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              const { credential } = credentialResponse;
              console.log('Google Token:', credential);
              const decodedToken = JSON.parse(atob(credential.split('.')[1])); 
              const userData = {
                name: decodedToken.name,
                email: decodedToken.email,
                picture: decodedToken.picture,
              };
              localStorage.setItem('userdata', JSON.stringify(userData));
              console.log(localStorage.getItem('userdata'));
              if (credential) {
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
