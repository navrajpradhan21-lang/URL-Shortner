export const validateUrl = (req,res,next)=>{
    const {url} = req.body;
    if(!url){
        return res.status(400).json({
            success:false,
            message:"URL is required"
        });
    }
    try{
        const parsedUrl = new URL(url);
        if(!["http:","https:"].includes(parsedUrl.protocol)){
            throw new Error("Invalid protocal");
        }
        next();
    }catch(error){
        return res.status(400).json({
            success:false,
            message:"Please provide HTTP ot HTTPS URL "
        });
    }
};
