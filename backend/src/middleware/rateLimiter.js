import redis from '../config/redis.js';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 5;

export const rateLimiter = async(req,res,next)=>{
    try{
        const ip = req.ip;
        const key = `rate-limit:${ip}`
        console.log("CLIENT IP:", ip);
        console.log("REDIS KEY:", key);

        //1. Increament request counter
        const requests = await redis.incr(key);
        console.log("REQUEST COUNT:", requests);

        //2.Set expiration for first request
        if(requests === 1){
            await redis.expire(key, WINDOW_SECONDS)
        }
        console.log("REDIS TTL:", await redis.ttl(key));
        //3. Get remaining time 
        const ttl = await redis.ttl(key);

        //4. Calculation remaining requests
        const remaining = Math.max(
            MAX_REQUESTS - requests,
            0
        );
        //5. Set rate Limit headers
        res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
        res.setHeader("X-RateLimit-Remaining", remaining);
        res.setHeader(
            "X-RateLimit-Reset",
            Math.floor(Date.now()/1000)+ttl
        )
        // 6. Check request limit
        if (requests > MAX_REQUESTS) {

            res.setHeader("Retry-After", ttl);

            return res.status(429).json({
                success: false,
                message: "Too many requests. Try again later.",
                retryAfter: ttl
            });
        }
        next();

    }catch(error){
        console.error("Rate limiter error:", error.message);

        // Fail open if Redis is unavailable
        next();

    }
};