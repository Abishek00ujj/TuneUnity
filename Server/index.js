const exp = require('constants');
const express =require('express');
const http=require('http');
const socketio=require("socket.io");
const cors=require('cors');

const app=express();
app.use(cors());
app.use(express.json());
const server=http.createServer(app);
const io=socketio(server,{ cors:{ origin:"*" }});


io.on('connect',(socket)=>{
    console.log("User connected!");


io.on('disconnect',()=>{
    console.log("User disconnected!");
})
})

server.listen(199,()=>{
    console.log("server is running in the port http://localhost:199");
});