import express from 'express';
import { getTags, addTag, updateTag, deleteTag } from '../controllers/tagController.js';

const router = express.Router();

router.get('/', getTags);
router.post('/', addTag);
router.put('/:id', updateTag);
router.delete('/:id', deleteTag);

export default router;
