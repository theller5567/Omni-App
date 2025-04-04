import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { fetchAllUsers } from '../store/slices/userSlice';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { alpha, Avatar, Box, Button, Grid, IconButton, styled, Toolbar, Tooltip, Typography } from '@mui/material';
import { FaTrash } from 'react-icons/fa';
import { FaEdit } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './accountUsers.scss';
import { AppDispatch } from '../store/store';
import type { User } from '../types/userTypes';

const AccountUsers = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser, users } = useSelector((state: RootState) => state.user);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    // Fetch users if we're admin/super-admin and users haven't been loaded yet
    console.log('AccountUsers - Current state:', {
      role: currentUser?.role,
      usersCount: users.allUsers?.length,
      usersStatus: users.status
    });
    
    if ((currentUser?.role === 'admin' || currentUser?.role === 'superAdmin') && 
        (users.status === 'idle' || (!users.allUsers || users.allUsers.length === 0))) {
      console.log('AccountUsers - Fetching users');
      dispatch(fetchAllUsers());
    }
  }, [dispatch, currentUser?.role, users.status, users.allUsers]);

  // Show loading state
  if (users.status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading users...</Typography>
      </Box>
    );
  }

  // Show error state
  if (users.status === 'failed') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="error">Error: {users.error || 'Failed to load users'}</Typography>
      </Box>
    );
  }

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
          {selectedUser && (
            <EnhancedTableToolbar numSelected={1} />
          )}
      <CustomGrid container spacing={2}>
        <Grid item xs={12}>
          <DataGrid
            slots={{
                toolbar: GridToolbar,
              }}
              rows={users.allUsers}
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
                const selectedId = newSelection[0];
                const foundUser = users.allUsers.find(u => u._id === selectedId);
                setSelectedUser(foundUser || null);
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