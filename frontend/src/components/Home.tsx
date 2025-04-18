import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ToastContainer } from "react-toastify"; // Import Toastify for success message
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for Toast notifications
import { Box, Paper, Typography } from "@mui/material";
import axios from 'axios';
import { DataGrid, GridColDef, GridPaginationModel, GridToolbar } from '@mui/x-data-grid';
import { motion } from 'framer-motion';
import './home.scss';

interface ContactProperties {
  createdate: string;
  email: string;
  firstname: string;
  hs_object_id: string;
  lastmodifieddate: string;
  lastname: string;
}

interface Contact {
  id: string;
  properties: ContactProperties;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

interface HubSpotResponse {
  results: Contact[];
  paging?: {
    next?: {
      after: string;
      link: string;
    };
  };
}

const HomePage: React.FC = () => {

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ pageSize: 10, page: 0 });
  const [hasMore, setHasMore] = useState<boolean>(true);

  

  const fetchContacts = async (after?: string, pageSize: number = paginationModel.pageSize) => {
    try {
      const response = await axios.get<HubSpotResponse>('/api/hubspot/contacts', {
        params: { after, limit: pageSize },
      });
      const fetchedContacts = response.data.results;
      setContacts(fetchedContacts);
      localStorage.setItem('contacts', JSON.stringify(fetchedContacts));
      setNextPage(response.data.paging?.next?.after || null);
      setHasMore(fetchedContacts.length === pageSize);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch contacts', err);
      setError('Failed to fetch contacts');
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedContacts = localStorage.getItem('contacts');
    if (cachedContacts) {
      const parsedContacts = JSON.parse(cachedContacts);
      console.log("Cached contacts:", parsedContacts);
      if (parsedContacts.length > 0) {
        setContacts(parsedContacts);
        setLoading(false);
      } else {
        fetchContacts();
      }
    } else {
      fetchContacts();
    }
  }, []);

  const handlePaginationChange = useCallback((newModel: GridPaginationModel) => {
    setPaginationModel(newModel);
    if (newModel.page > paginationModel.page && hasMore) {
      fetchContacts(nextPage ?? undefined, newModel.pageSize);
    }
  }, [paginationModel.page, hasMore, nextPage]);

  const columns: GridColDef[] = useMemo(() => [
    { field: 'id', headerName: 'ID', flex: 0.5 },
    { field: 'firstname', headerName: 'First Name', flex: 1 },
    { field: 'lastname', headerName: 'Last Name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1.5 },
    { field: 'createdate', headerName: 'Created Date', flex: 1 },
    { field: 'lastmodifieddate', headerName: 'Last Modified Date', flex: 1 },
  ], []);

  const rows = useMemo(() => contacts.map(contact => ({
    id: contact.id,
    firstname: contact.properties.firstname,
    lastname: contact.properties.lastname,
    email: contact.properties.email,
    createdate: contact.properties.createdate,
    lastmodifieddate: contact.properties.lastmodifieddate,
  })), [contacts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
    <Box id="home-page">
      <Paper elevation={3}  sx={{ background: 'none', padding: '2rem', width: "100%", height: "100%" }}>
      <Typography variant="h2" align="left" sx={{paddingBottom: '2rem'}}>HubSpot Contacts</Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <div className="data-grid-container">
            <DataGrid
              slots={{
                toolbar: GridToolbar,
              }}
              rows={rows}
              columns={columns}
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationChange}
              pageSizeOptions={[5, 10, 20]}
              pagination
              rowCount={hasMore ? -1 : contacts.length}
              paginationMode="server"
              autoHeight
            />
          </div>
        )}
      </Paper>

      {/* Toast Notifications */}
      <ToastContainer />
    </Box>
    </motion.div>
  );
};

export default HomePage;