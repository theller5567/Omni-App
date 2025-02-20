import { uploadFileToS3 } from '../services/awsService.js';

export const uploadMedia = async (req, res) => {
  try {
    const location = await uploadFileToS3(req.file);
    res.status(200).json({ location });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
};