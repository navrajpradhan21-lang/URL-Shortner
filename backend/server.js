import app from "./src/app.js";
import { configDotenv } from "dotenv";
import redis from "./src/config/redis.js";
import connectDB from "./src/config/db.js";
import mongoose from "mongoose";

configDotenv();

const PORT = process.env.PORT || 5000;

let server;

const startServer = async()=>{
    try{
        await connectDB();

        server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    }catch(error){
        console.error("Server startup failed:", error);
        process.exit(1);

    }
};

const shutdown = async(signal)=>{
    console.log(`${signal} recieved. Shutting down ...`);
    if(server){
        server.close(async()=>{
            try{
                await redis.quit();
                await mongoose.connection.close();
                console.log("Server shut down successfully");
                process.exit(0);
            }catch(error){
                console.error("Shutdown error:",error);
                process.exit(1);
            }
        });
    }else{
        process.exit(0);
    }
};
process.on("SIGTERM",()=>shutdown("SIGTERM"));
process.on("SIGINT",()=>shutdown("SIGINT"));

startServer();
