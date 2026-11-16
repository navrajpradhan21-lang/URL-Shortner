import express from 'express';
import { createShortUrl , getUrlStatsController} from '../controllers/short_url.controller.js';
import { validateUrl } from '../middleware/validateUrl.js';
import { updatedUrlController,deleteShortUrlController } from '../controllers/short_url.controller.js';




const router  = express.Router();

router.post('/create',validateUrl,createShortUrl) // Create URL
router.get('/stats/:id',getUrlStatsController) // Analytics

router.patch("/:id",validateUrl,updatedUrlController) // Update URL
router.delete("/:id",deleteShortUrlController) // Delete URL


export default router;