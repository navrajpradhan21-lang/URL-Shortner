import { createShortUrlService, getUrlStats } from "../service/short_url.service.js";
import { getShortUrlAndIncrement } from "../service/short_url.service.js";
import { updateUrlService,deleteShortUrlService } from "../service/short_url.service.js";

export const createShortUrl = async (req, res) => {
    try {
        const { url, customAlias, expiresAt } = req.body;
        const short_url = await createShortUrlService(url, customAlias, expiresAt)
        res.status(201).json({
            success: true,
            message: `${process.env.APP_URL}/${short_url}`
        })
    } catch (error) {
        if (error.message.includes("Expiration date")) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        const statusCode = error.message.includes("already taken")
            ? 409
            : error.message.includes("Invalid custom alias") ||
                error.message.includes("reserved") ? 400 : 500;


        res.status(statusCode).json({
            success: false,
            message: error.message
        })
    }
};

export const redirectFromShortUrl = async (req, res) => {
    try {
        const { id } = req.params;
        const url = await getShortUrlAndIncrement(id)

        if (!url) {
            return res.status(404).json({
                success: false,
                message: "Short URL not found"
            })
        }
        return res.redirect(302, url.full_url);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const getUrlStatsController = async (req, res) => {
    try {
        const { id } = req.params;
        const stats = await getUrlStats(id);
        if (!stats) {
            return res.status(404).json({
                success: false,
                message: "Short URL not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
}

export const updatedUrlController = async(req,res)=>{
    try{
        const {id} = req.params;
        const{url} = req.body;

        const updatedUrl = await updateUrlService(id,url);
        if(!updatedUrl){
            return res.status(404).json({
                success:false,
                message:"Short URL not Found"
            });
        }
        return res.status(200).json({
            success:true,
            message:"Short URl Update successfully",
            data:updatedUrl
        });

    }catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteShortUrlController = async(req,res)=>{
    try{
        const {id} = req.params
        const deletedUrl = await deleteShortUrlService(id);
        if(!deletedUrl){
            return res.status(404).json({
                success:false,
                message:"Short URL not found"
            });
        }
        return res.status(200).json({
            success:true,
            message:"Short URL deleted successfully"
        });

    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        });
    }
};