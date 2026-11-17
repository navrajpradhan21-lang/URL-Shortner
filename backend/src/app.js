import express from "express";
import dotenv from "dotenv";
import { nanoid } from "nanoid";

import shortUrlModel from "./models/shorturl.models.js";
import shortUrlRouter from "./routes/short_url.routes.js"; 
import { redirectFromShortUrl } from "./controllers/short_url.controller.js";
import { rateLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({extended:true}))

app.use("/api",rateLimiter,shortUrlRouter)
app.get("/:id", rateLimiter,redirectFromShortUrl)
 

export default app;


// GET - Rediration 
// POST -  Create short url
