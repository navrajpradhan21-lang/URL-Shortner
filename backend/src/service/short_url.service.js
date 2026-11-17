import { generateNanoId } from "../utils/helper.js";
import shortUrlModel from "../models/shorturl.models.js";
import { getCachedUrl, cacheUrl, deleteCachedUrl } from "./cache.services.js";

export const createShortUrlService = async (url, customAlias = null, expiresAt = null) => {


    let expirationDate = null;
    if (expiresAt) {
        expirationDate = new Date(expiresAt);
        if (
            Number.isNaN(expirationDate.getTime()) ||
            expirationDate <= new Date()
        ) {
            throw new Error("Expiration date must be a valid future date");
        }
    }


    // Custom alias validation
    if (customAlias) {
        customAlias = customAlias.trim();

        if (!/^[a-zA-Z0-9_-]{3,30}$/.test(customAlias)) {
            throw new Error("Invalid custom alias. Use 3-30 alphanumeric characters, hyphens or underscores.");
        }

        if (customAlias.toLowerCase() === "api") {
            throw new Error("This alias is reserved.");
        }
        try {
            const newUrl = await shortUrlModel.create({
                full_url: url,
                short_url: customAlias
            });

            return newUrl.short_url;

        } catch (error) {
            if (error.code === 11000) {
                throw new Error("Custom alias is already taken");
            }
            throw error;

        }

    }
    // Automatically generate alias

    const MAX_RETRIES = 5;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const shortUrl = generateNanoId(7);
        try {

            await shortUrlModel.create({
                full_url: url,
                short_url: shortUrl
            })
            return shortUrl;

        } catch (error) {
            // duplicate Short URL collison
            if (error.code === 11000 && attempt < MAX_RETRIES) {
                continue;
            }
            throw error;
        }
    }
    throw new Error("Unable to generate a unique short URL");
};


export const getShortUrlAndIncrement = async (id) => {
    try {

        // 1.Check Redis First
        const cachedUrl = await getCachedUrl(id);

        if (cachedUrl) {
            //2. Checked whether URL has expired
            if (cachedUrl.expiresAt && new Date(cachedUrl.expiresAt) <= new Date()) {
                await deleteCachedUrl(id);
                return null;
            }
            //3. Atomically increament MongoDB click count
            const result = await shortUrlModel.findOneAndUpdate(
                {
                    short_url: id,
                    // Filter conditions or means either one of the following must be true
                    $or: [
                        { expiresAt: null }, // no expiration
                        { expiresAt: { $gt: new Date() } } // gt means greater than
                        //MongoDB checks whether the expiration date is greater than the current date and time.
                    ]
                },
                {
                    $inc: { clicks: 1 }
                },
                {
                    new: true
                }
            );

            // URL may have been deleted or expired
            if (result.matchedCount === 0) {
                await deleteCachedUrl(id);
                return null;
            };
            // 4. Return cached original URL
            return {
                full_url: cachedUrl.full_url
            };

        };
        // 5.Catch Miss : fetch from Mongo Db and increament 
        const url = await shortUrlModel.findOneAndUpdate(
            {
                short_url: id,
                $or: [
                    { expiresAt: null },
                    { expiresAt: { $gt: new Date() } }
                ]

            },
            {
                $inc: { clicks: 1 }

            },
            {
                new: true
            }
        );

        if (!url) {
            return null;
        }
        // 6. Save URL in Redis
        await cacheUrl(id, {
            full_url: url.full_url,
            expiresAt: url.expiresAt
        });

        return url;

    } catch (error) {
        console.error("URL redirected server error:",error);
        throw error;
    }
};



export const getUrlStats = async (id) => {
    return await shortUrlModel.findOne({
        short_url: id
    }).select("short_url full_url clicks createdAt");

};

// Update url service 
export const updateUrlService = async(id,newUrl) =>{
    const updatedUrl = await shortUrlModel.findOneAndUpdate(
        {
            short_url:id
        },
        {
            $set:{
                full_url:newUrl
            }
        },
        {
            new:true,
            runValidators:true
        }
    );
    if(!updatedUrl){
        return null;
    }
    // Invalidate Old cached data
    await deleteCachedUrl(id);
    return updatedUrl;

}
// Notice the sequence:
// 1. Update MongoDB.
// 2. Invalidate Redis.
// 3. Return updated document.


// Delete URL service
export const deleteShortUrlService = async(id)=>{
    const deletedUrl = await shortUrlModel.findOneAndDelete({
        short_url:id
    });
    if(!deletedUrl){
        return null;
    }
    // Remove the cached entry
    await deleteCachedUrl(id);
    
    return deletedUrl;
};