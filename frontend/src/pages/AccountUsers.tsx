import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { fetchAllUsers, updateUser } from '../store/slices/userSlice';
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from '@mui/x-data-grid';
import { 
  alpha, 
  Avatar, 
  Box, 
  Button, 
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid, 
  IconButton, 
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Toolbar, 
  Tooltip, 
  Typography,
  useMediaQuery,
  Theme
} from '@mui/material';
import { toast } from 'react-toastify';
import { FaTrash, FaEdit, FaUser, FaEnvelope, FaIdCard, FaUserTag } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './accountUsers.scss';
import { AppDispatch } from '../store/store';
import type { User } from '../types/userTypes';
import { SelectChangeEvent } from '@mui/material';

const AccountUsers = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser, users } = useSelector((state: RootState) => state.user);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    role: ''
  });
  
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

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

  const handleEdit = (id: string) => {
    const user = users.allUsers.find(u => u._id === id);
    if (user) {
      setUserToEdit(user);
      setEditFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        username: user.username || '',
        role: user.role || 'user'
      });
      setEditDialogOpen(true);
    }
  };

  const handleEditSubmit = async () => {
    if (!userToEdit) return;
    
    try {
      // Cast role to the proper type
      const role = editFormData.role as 'user' | 'admin' | 'distributor' | 'superAdmin';
      
      await dispatch(updateUser({
        _id: userToEdit._id,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        username: editFormData.username,
        role
      })).unwrap();
      
      toast.success('User updated successfully');
      setEditDialogOpen(false);
      setUserToEdit(null);
    } catch (error) {
      toast.error('Failed to update user');
      console.error('Update error:', error);
    }
  };

  const handleDeleteClick = (id: string) => {
    setUserIdToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    // Implement actual delete functionality here
    console.log('Delete user', userIdToDelete);
    setDeleteDialogOpen(false);
    setUserIdToDelete(null);
    // You might want to add an actual deleteUser action
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  // User Cell Component for DataGrid
  const UserCell = ({ params }: { params: GridRenderCellParams }) => {
    const { value } = params;
    
    return (
      <div className="user-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'start', gap: '8px' }}>
        <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: `var(--${params.row.role === 'superAdmin' ? 'accent-color' : params.row.role === 'admin' ? 'primary-color' : 'secondary-color'})` 
              }} 
              src={params.row.avatar}
            >
              {params.row.firstName?.[0] || params.row.username?.[0] || 'U'}
            </Avatar>
        <Typography variant="body2">{value}</Typography>
      </div>
    );
  };

  const columns: GridColDef[] = [
    { 
      field: 'username', 
      headerName: 'Username',
      flex: 1,
      renderCell: (params) => <UserCell params={params} />
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return null;
        return <span>{params.row.email}</span>;
      }
    },
    { 
      field: 'fullName', 
      headerName: 'Full Name', 
      flex: 1,
      minWidth: 150,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return null;
        const fullName = `${params.row.firstName || ''} ${params.row.lastName || ''}`.trim();
        return <span>{fullName || 'Not set'}</span>;
      }
    },
    { 
      field: 'role', 
      headerName: 'Role', 
      flex: 0.5,
      minWidth: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return null;
        
        const roleColors = {
          superAdmin: '#f44336',
          admin: '#3f51b5',
          distributor: '#ff9800',
          user: '#757575'
        };
        
        const roleBgColors = {
          superAdmin: 'rgba(244, 67, 54, 0.12)',
          admin: 'rgba(63, 81, 181, 0.12)',
          distributor: 'rgba(255, 152, 0, 0.12)',
          user: 'rgba(117, 117, 117, 0.12)'
        };
        
        return (
          <Chip 
            label={params.row.role} 
            size="small"
            sx={{ 
              fontWeight: 500,
              textTransform: 'capitalize',
              bgcolor: roleBgColors[params.row.role as keyof typeof roleBgColors] || roleBgColors.user,
              color: roleColors[params.row.role as keyof typeof roleColors] || roleColors.user,
              border: `1px solid ${roleColors[params.row.role as keyof typeof roleColors] || roleColors.user}`,
              borderRadius: '16px',
            }}
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      minWidth: 120,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return null;
        return (
          <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%' }}>
            <Tooltip title="Edit User">
              <IconButton
                color="primary"
                size="small"
                onClick={() => handleEdit(params.row._id)}
                className="action-button edit"
              >
                <FaEdit />
              </IconButton>
            </Tooltip>
            
            {currentUser?.role === 'superAdmin' && params.row._id !== currentUser._id && (
              <Tooltip title="Delete User">
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => handleDeleteClick(params.row._id)}
                  className="action-button delete"
                >
                  <FaTrash />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
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
      {numSelected > 0 && currentUser?.role === 'superAdmin' ? (
        <Tooltip title="Delete">
          <IconButton onClick={() => handleDeleteClick(selectedUser?._id || '')}>
            <FaTrash />
          </IconButton>
        </Tooltip>
      ) : null}
    </Toolbar>
  );

  const containerVariants = {
    hidden: { opacity: 0, x: isMobile ? -100 : -350 },
    visible: { opacity: 1, x: 0, transition: { duration: isMobile ? 0.3 : 0.5 } },
    exit: { opacity: 0, x: isMobile ? -100 : -350, transition: { duration: isMobile ? 0.3 : 0.5 } },
  };

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

  return (
    <motion.div
      id="account-users"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Box className="account-users" sx={{ width: '100%', overflow: 'hidden' }}>
        <Typography variant="h1" align="left" sx={{ paddingBottom: isMobile ? '1rem' : '2rem' }}>
          Manage Users
        </Typography>
        
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Manage user accounts, edit user details, and control access permissions. 
            {currentUser?.role === 'superAdmin' && ' As a super admin, you can also delete user accounts.'}
          </Typography>
          
          {selectedUser && (
            <EnhancedTableToolbar numSelected={1} />
          )}
          
          <Box sx={{ height: 500, width: '100%', mt: 2 }}>
            <DataGrid
              className="users-data-grid"
              rows={users.allUsers}
              columns={columns}
              getRowId={(row) => row._id}
              pageSizeOptions={[5, 10, 20, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
                sorting: {
                  sortModel: [{ field: 'username', sort: 'asc' }],
                },
              }}
              checkboxSelection={currentUser?.role === 'superAdmin'}
              disableRowSelectionOnClick
              onRowSelectionModelChange={(newSelection) => {
                const selectedId = newSelection[0];
                const foundUser = users.allUsers.find(u => u._id === selectedId);
                setSelectedUser(foundUser || null);
              }}
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
              sx={{
                border: 'none',
                fontFamily: 'inherit',
                '& .MuiDataGrid-columnHeader': {
                  backgroundColor: 'var(--bg-secondary, #222)',
                  color: 'var(--text-color, #fff)',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'var(--text-color, #fff)',
                  fontFamily: 'inherit',
                },
                '& .MuiDataGrid-columnHeaderTitleContainer': {
                  justifyContent: 'left',
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid var(--border-color, #333)',
                  color: 'var(--text-color, #fff)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'left',
                },
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-row': {
                  height: '52px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                },
                '& .MuiCheckbox-root': {
                  color: 'var(--text-color, #fff)',
                  padding: '4px',
                  '&.Mui-checked': {
                    color: 'var(--primary-color, #4dabf5)',
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.25rem',
                    width: '1.25rem',
                    height: '1.25rem',
                  }
                },
                '& .MuiDataGrid-cellCheckbox, & .MuiDataGrid-columnHeaderCheckbox': {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'left',
                  padding: '0 6px',
                  '& .MuiCheckbox-root': {
                    padding: 0,
                  }
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '1px solid var(--border-color, #333)',
                  backgroundColor: 'var(--bg-secondary, #222)',
                  fontFamily: 'inherit',
                },
                '& .MuiTablePagination-root': {
                  color: 'var(--text-color, #fff)',
                  fontFamily: 'inherit',
                },
                '& .MuiIconButton-root': {
                  color: 'var(--text-color, #fff)',
                },
                '& .MuiDataGrid-virtualScroller': {
                  backgroundColor: 'var(--bg-secondary, #222)',
                },
                '& .MuiDataGrid-main': {
                  backgroundColor: 'var(--bg-secondary, #222)',
                  color: 'var(--text-color, #fff)',
                  fontFamily: 'inherit',
                },
                '& .MuiDataGrid-toolbarContainer': {
                  backgroundColor: 'var(--bg-secondary, #222)',
                  padding: '8px 16px',
                  borderBottom: '1px solid var(--border-color, #333)',
                  fontFamily: 'inherit',
                },
                '& .MuiInputBase-root': {
                  color: 'var(--text-color, #fff)',
                  backgroundColor: 'var(--background-color, #121212)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontFamily: 'inherit',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--border-color, #333)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--border-color, #555)',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary, #aaa)',
                  fontFamily: 'inherit',
                },
                '& .MuiDataGrid-columnSeparator': {
                  color: 'var(--border-color, #333)',
                },
              }}
            />
          </Box>
        </Paper>
      </Box>
      
      {/* Edit User Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Edit User
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="firstName"
                  label="First Name"
                  value={editFormData.firstName}
                  onChange={handleFieldChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <FaUser style={{ marginRight: '8px', color: 'var(--accent-color)' }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="lastName"
                  label="Last Name"
                  value={editFormData.lastName}
                  onChange={handleFieldChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <FaIdCard style={{ marginRight: '8px', color: 'var(--accent-color)' }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  value={editFormData.email}
                  onChange={handleFieldChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <FaEnvelope style={{ marginRight: '8px', color: 'var(--accent-color)' }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="username"
                  label="Username"
                  value={editFormData.username}
                  onChange={handleFieldChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <FaUser style={{ marginRight: '8px', color: 'var(--accent-color)' }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    name="role"
                    value={editFormData.role}
                    onChange={handleFieldChange}
                    label="Role"
                    disabled={userToEdit?._id === currentUser?._id}
                    sx={{
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                      }
                    }}
                    startAdornment={
                      <FaUserTag style={{ marginRight: '8px', color: 'var(--accent-color)' }} />
                    }
                  >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="distributor">Distributor</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    {currentUser?.role === 'superAdmin' && (
                      <MenuItem value="superAdmin">Super Admin</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            {userToEdit?._id === currentUser?._id && (
              <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 2 }}>
                Note: You cannot change your own role.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained" 
            color="primary"
            disabled={!editFormData.username || !editFormData.email}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this user? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default AccountUsers;