import express from "express";
import dotenv from "dotenv";
import { nanoid } from "nanoid";

import shortUrlModel from "./models/shorturl.models.js";
import shortUrlRouter from "./routes/short_url.routes.js"; 
import { redirectFromShortUrl } from "./controllers/short_url.controller.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import mongoose from "mongoose";
import redis from "./config/redis.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({extended:true}))


// Liveness Check
app.get("/health",(req,res)=>{
    res.status(200).json({
        success:true,
        status:"healthy",
        message:"Server is running"
    });
});

// Readiness Check
app.get("/ready",(req,res)=>{
    const mongoReady = mongoose.connection.readyState ===1;
    const redisReady = redis.status === "ready";

    const isReady = mongoReady && redisReady;

    res.status(isReady?200:503).json({
        success:isReady,
        status: isReady? "ready":"not Ready",
        dependencies: {
            mongodb: mongoReady ? "connected" : "disconnected",
            redis: redisReady ? "connected" : "disconnected"
        }
    })
})


app.use("/api",rateLimiter,shortUrlRouter)
app.get("/:id", rateLimiter,redirectFromShortUrl)
 

export default app;


// GET - Rediration 
// POST -  Create short url
