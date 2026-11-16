import Redis from "ioredis";
import { configDotenv } from "dotenv";

configDotenv();

const redis = new Redis(process.env.REDIS_URL,{
    maxRetriesPerRequest: 1,
    connectTimeout:3000,

    retryStrategy(times){
        return Math.min(times*200,2000);
    }
});


redis.on("connect",()=>{
    console.log("Redis Connected")
})

redis.on("error",(error)=>{
    console.error("redis error:",error.message)
});

export default redis;
