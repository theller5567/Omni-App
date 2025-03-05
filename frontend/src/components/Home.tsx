import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from "react-toastify"; // Import Toastify for success message
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for Toast notifications
import { Box, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import axios from 'axios';
import { DataGrid, GridColDef, GridPaginationModel, GridToolbar } from '@mui/x-data-grid';
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
  total: number; // Total number of records
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
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ pageSize: 10, page: 0 });
  const [totalRecords, setTotalRecords] = useState<number>(0);

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

  const fetchContacts = async (after?: string, pageSize: number = paginationModel.pageSize) => {
    try {
      const response = await axios.get<HubSpotResponse>('/api/hubspot/contacts', {
        params: { after, limit: pageSize },
      });
      setContacts(response.data.results);
      setNextPage(response.data.paging?.next?.after || null);
      setTotalRecords(response.data.total);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch contacts');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handlePaginationChange = (newModel: GridPaginationModel) => {
    setPaginationModel(newModel);
    fetchContacts(newModel.page > paginationModel.page ? nextPage ?? undefined : undefined, newModel.pageSize);
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', flex: 0.5 },
    { field: 'firstname', headerName: 'First Name', flex: 1 },
    { field: 'lastname', headerName: 'Last Name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1.5 },
    { field: 'createdate', headerName: 'Created Date', flex: 1 },
    { field: 'lastmodifieddate', headerName: 'Last Modified Date', flex: 1 },
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
    <Box id="home-page" display="flex" justifyContent="center" alignItems="start" height="100vh" sx={{ marginLeft: '250px' }}>
      <Paper elevation={3} sx={{ padding: '2rem', width: "100%", height: "100%" }}>
      <Typography variant="h2" align="left" sx={{paddingBottom: '2rem'}}>HubSpot Contacts</Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <div style={{ width: '100%' }}>
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
              rowCount={totalRecords}
              paginationMode="server"
            />
          </div>
        )}
      </Paper>

      {/* Toast Notifications */}
      <ToastContainer />
    </Box>
  );
};

export default HomePage;