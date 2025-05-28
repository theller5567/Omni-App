import React, { useEffect, useState } from 'react';
import { toast } from "react-toastify"; // Import Toastify for success message
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for Toast notifications
import { Box, Paper, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import axios from 'axios';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

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
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(window.location.search);
      const emailVerified = params.get("emailVerified");
      if (emailVerified) {
        // Show success message
        toast.success("Your email has been successfully verified!");
        // Navigate to home page after showing the success message
        navigate("/home");
      }
    };

    fetchData();
  }, [navigate]); // Ensure this runs only after the component mounts

  const fetchContacts = async (after?: string) => {
    try {
      const response = await axios.get<HubSpotResponse>('/api/hubspot/contacts', {
        params: { after },
      });
      setContacts(prevContacts => [...prevContacts, ...response.data.results]);
      setNextPage(response.data.paging?.next?.after || null);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch contacts');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'firstname', headerName: 'First Name', width: 150 },
    { field: 'lastname', headerName: 'Last Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'createdate', headerName: 'Created Date', width: 180 },
    { field: 'lastmodifieddate', headerName: 'Last Modified Date', width: 180 },
  ];

  const rows = contacts.map(contact => ({
    id: contact.id,
    firstname: contact.properties.firstname,
    lastname: contact.properties.lastname,
    email: contact.properties.email,
    createdate: contact.properties.createdate,
    lastmodifieddate: contact.properties.lastmodifieddate,
  }));

  return (
    <Box display="flex" justifyContent="center" alignItems="start" height="100vh">
      <Paper elevation={3} sx={{ padding: '2rem', width: "100%", marginBlock: '2rem' }}>
        <Typography variant="h5" align="center" gutterBottom>
          Contacts
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={rows}
                columns={columns}
                paginationModel={{ pageSize: 5, page: 0 }}
                pageSizeOptions={[5]}
                pagination
              />
            </div>
            {nextPage && (
              <Button onClick={() => fetchContacts(nextPage)} variant="contained" color="primary">
                Load More
              </Button>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default HomePage;