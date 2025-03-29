import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { fetchAllUsers } from '../store/slices/userSlice';
import { DataGrid, GridColDef, GridRowId, GridToolbar } from '@mui/x-data-grid';
import { alpha, Avatar, Box, Button, Grid, IconButton, styled, Toolbar, Tooltip, Typography } from '@mui/material';
import { FaTrash } from 'react-icons/fa';
import { FaEdit } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './accountUsers.scss';

const AccountUsers: React.FC = () => {
  const dispatch = useDispatch();
  const [selected, setSelected] = useState<GridRowId[]>([]);

  useEffect(() => {
    dispatch(fetchAllUsers() as any);
  }, [dispatch]);

  const CustomGrid = styled(Grid)({
    '&.grid-view': {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: '16px',
    },
    '&.list-view': {
      display: 'block',
      gap: '2px'
    },
  });

  const handleEdit = (id: string) => {
    console.log('Edit user', id);
  };

  const handleDeleteClick = (id: string) => {
    console.log('Delete user', id);
  };

  const handleDeleteSelected = () => {
    console.log('Delete selected users');
  };

  const columns: GridColDef[] = [
    { field: 'username', headerName: 'User Name', flex: 0.5, renderCell: (params) => (
      <div className="user-name" style={{ display: 'flex', justifyContent: 'left', gap: '1rem', alignItems: 'center' }}>
        <span><Avatar sx={{ width: 32, height: 32 }} src={params.row.avatar} /></span>
        <span>{params.row.username}</span>
      </div>
    )},
    { field: 'email', headerName: 'Email', flex: 0.5, renderCell: (params) => (
      <span>{params.row.email}</span>
    )},
    { field: 'role', headerName: 'Role', flex: 0.5, renderCell: (params) => (
      <span>{params.row.role}</span>
    )},
        { 
      field: 'firstName', 
      headerName: 'First Name', 
      flex: 0.5,
    },
    { field: 'lastName', headerName: 'Last Name', flex: 0.5 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      sortable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleEdit(params.row.id)}
          >
            <FaEdit />
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleDeleteClick(params.row.id)}
          >
            <FaTrash />
          </Button>
        </div>
      ),
    },
  ];

  const EnhancedTableToolbar = ({ numSelected }: { numSelected: number }) => (
    
    <Toolbar
      className="toolbar"
      sx={{
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
        }),
      }}
    >
      {numSelected > 0 && (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected} selected
        </Typography>
      )}
      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton onClick={handleDeleteSelected}>
            <FaTrash />
          </IconButton>
        </Tooltip>
      ) : null}
    </Toolbar>
  );

  const containerVariants = {
    hidden: { opacity: 0, x: -350 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -350, transition: { duration: 0.5 } },
  };


  // Select users and status from the Redux store
  const { allUsers } = useSelector((state: RootState) => state.user.users);
  return (
    <motion.div
      id="account-users"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Box className="account-users" sx={{ width: '100%', overflow: 'hidden' }}>
        <Typography variant="h2" align="left" sx={{ paddingBottom: '2rem' }}>Account Users</Typography>
        <Box sx={{ width: '100%', height: 'calc(100% - 4rem)', overflow: 'hidden' }}>
          {selected.length > 0 && (
            <EnhancedTableToolbar numSelected={selected.length} />
          )}
      <CustomGrid container spacing={2}>
        <Grid item xs={12}>
          <DataGrid
            slots={{
                toolbar: GridToolbar,
              }}
              rows={allUsers}
              columns={columns}
              getRowId={(row) => row._id}
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
                sorting: {
                  sortModel: [{ field: 'modifiedDate', sort: 'desc' }],
                },
              }}
              checkboxSelection
              disableRowSelectionOnClick
              onRowSelectionModelChange={(newSelection) => {
                setSelected([...newSelection]);
              }}
          />
        </Grid>
      </CustomGrid>
    </Box>
    </Box>
    </motion.div>
  );
};

export default AccountUsers;