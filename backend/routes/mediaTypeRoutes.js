import express from 'express';
import { addMediaType, getMediaTypes } from '../controllers/mediaTypeController.js';

const router = express.Router();

router.post('/', addMediaType);
router.get('/', getMediaTypes);

export default router;
