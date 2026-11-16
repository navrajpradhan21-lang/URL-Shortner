import redis from "../config/redis.js"

const CACHE_TTL = 36000; // 1 hour


// GET from REDIS 
export const getCachedUrl = async (id) => {
    try {
        const cachedData = await redis.get(`shorturl:${id}`);
        if (!cachedData) {
            return null;
        }
        return JSON.parse(cachedData);

    } catch (error) {
        console.error("Redis GET failed:", error.message);

        // Fallback to MongoDB
        return null;


    }
};

// STORE IN REDIS 
export const cacheUrl = async (id, urlData) => {
    try {
        const { full_url, expiredAt } = urlData;
        let ttl = CACHE_TTL;

        if (expiredAt) {
            const remainingTime = Math.floor(
                (new Date(expiredAt).getTime() - Date.now()) / 1000
            );
            if (remainingTime <= 0) {
                return
            }
            ttl = Math.min(ttl, remainingTime)
        }
        await redis.set(
            `shorturl:${id}`,
            JSON.stringify({
                full_url,
                expiredAt
            }),
            "EX",
            ttl
        );
        console.log("URL CACHED:", id);
    } catch (error) {
        console.error("Redis SET failed:", error.message);

        // Don't interrupt the redirect

    }
};

// DELETE FROM REDIS
export const deleteCachedUrl = async (id) => {
    try{
        await redis.del(`shorturl:${id}`);

    }catch(error){
        console.error("Redis DELETE failed:",error.message);
    }
};


// Notice three things:
// - Redis GET failure returns null, so the service queries MongoDB.
// - Redis SET failure doesn't interrupt the redirect.
// - Redis DELETE failure doesn't crash the application.