import express from "express";
import axios from 'axios';
import dotenv from 'dotenv';
const router = express.Router();

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the absolute path to the .env file
const envPath = path.resolve(__dirname, '../../.env');

// Load environment variables from the absolute path to the .env file
dotenv.config({ path: envPath });
// Example route to get quotes from HubSpot

router.get('/contacts', async (req, res) => {
  try {
    const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
      headers: {
        Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
      },
      params: {
        limit: req.query.limit || 20, // Use the limit from the request or default to 20
        after: req.query.after, // Use the 'after' parameter for pagination
      },
    });

    const contacts = response.data.results;
    const totalRecords = response.data.total || contacts.length;
    console.log('totalRecords', totalRecords);

    res.json({
      results: contacts,
      total: totalRecords,
      paging: response.data.paging,
    });
  } catch (error) {
    console.error('Error fetching data from HubSpot:', error);
    res.status(500).json({ error: 'Error fetching data from HubSpot' });
  }
});

export default router;