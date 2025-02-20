import express from 'express';
import multer from 'multer';
import { uploadMedia } from '../controllers/mediaController.js';

const router = express.Router();
const upload = multer();

router.post('/upload', upload.single('file'), (req, res, next) => {
  console.log('Received upload request');
  next();
}, uploadMedia);

export default router;