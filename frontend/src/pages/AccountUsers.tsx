import React, { useState } from 'react';
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from '@mui/x-data-grid';
import { 
  Avatar, 
  Box, 
  Button, 
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton, 
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip, 
  Typography,
  useMediaQuery,
  Theme,
  CircularProgress,
  Alert,
} from '@mui/material';
import { toast } from 'react-toastify';
import { FaTrash, FaEdit, FaEnvelope, FaTimes, FaUserPlus } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import './accountUsers.scss';
import { SelectChangeEvent } from '@mui/material';
import InvitationForm from '../components/UserInvitation/InvitationForm';
import InvitationList from '../components/UserInvitation/InvitationList';
import { 
  useUserProfile, 
  useAllUsers, 
  useUpdateUserProfile,
  User
} from '../hooks/query-hooks';

// Interface for tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab Panel component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-management-tabpanel-${index}`}
      aria-labelledby={`user-management-tab-${index}`}
      className="tab-panel"
      {...other}
    >
      {value === index && (
        <Box className="custom-tab-panel-content">
          {children}
        </Box>
      )}
    </div>
  );
}

// Tab access props
function a11yProps(index: number) {
  return {
    id: `user-management-tab-${index}`,
    'aria-controls': `user-management-tabpanel-${index}`,
  };
}

const AccountUsers: React.FC = () => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    role: 'user'
  });
  
  const [tabValue, setTabValue] = useState(0);
  const [newUserDialog, setNewUserDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  const { data: currentUserProfile, isLoading: isCurrentUserLoading, error: currentUserError } = useUserProfile();
  const { 
    data: usersData = [], 
    isLoading: isLoadingUsers, 
    error: usersError
  } = useAllUsers({
    enabled: !!currentUserProfile && ((currentUserProfile as User).role === 'admin' || (currentUserProfile as User).role === 'superAdmin')
  });
  const { mutate: updateUserMutate, isPending: isUpdatingUser } = useUpdateUserProfile();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleInvitationSent = () => {
    setNewUserDialog(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEdit = (user: User) => {
    setUserToEdit(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      username: user.username || '',
      role: user.role || 'user'
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!userToEdit || !userToEdit._id) {
      toast.error("User data is incomplete for update.");
      return;
    }

    const payload: Partial<User> & { _id: string } = { _id: userToEdit._id };
    let hasChanges = false;

    if (editFormData.firstName !== undefined && editFormData.firstName !== userToEdit.firstName) {
      payload.firstName = editFormData.firstName;
      hasChanges = true;
    }
    if (editFormData.lastName !== undefined && editFormData.lastName !== userToEdit.lastName) {
      payload.lastName = editFormData.lastName;
      hasChanges = true;
    }
    if (editFormData.email !== undefined && editFormData.email !== userToEdit.email) {
      payload.email = editFormData.email;
      hasChanges = true;
    }
    if (editFormData.role !== undefined && editFormData.role !== userToEdit.role) {
      payload.role = editFormData.role;
      hasChanges = true;
    }
    
    if (!hasChanges) {
      toast.info("No changes were made.");
      setEditDialogOpen(false);
      return;
    }

    updateUserMutate(payload, {
      onSuccess: (updatedUser) => {
        toast.success(`User ${updatedUser.username || 'profile'} updated successfully`);
        setEditDialogOpen(false);
        setUserToEdit(null);
      },
      onError: (error: any) => {
        toast.error(`Failed to update user: ${error.message || 'Unknown error'}`);
      }
    });
  };

  const handleDeleteClick = (id: string) => {
    setUserIdToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    console.log('Delete user action for ID:', userIdToDelete);
    toast.warn("Delete functionality not fully implemented yet.");
    setDeleteDialogOpen(false);
    setUserIdToDelete(null);
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

  const UserCell = ({ params }: { params: GridRenderCellParams<any, User> }) => {
    const { value } = params;
    const user = params.row;
    
    return (
      <div className="user-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'start', gap: '8px', height: '100%' }}>
        <Avatar 
          sx={{ 
            width: 32, 
            height: 32,
            bgcolor: `var(--${user.role === 'superAdmin' ? 'accent-color' : user.role === 'admin' ? 'primary-color' : 'secondary-color'})` 
          }} 
          src={user.avatar || undefined}
        >
          {(user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase()}
        </Avatar>
        <RouterLink className="user-link" to={`/user/${user._id}`} style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>
          <Typography variant="body2" sx={{ '&:hover': { textDecoration: 'underline' }}}>
            {value?.toString()}
          </Typography>
        </RouterLink>
      </div>
    );
  };

  const columns: GridColDef<User>[] = [
    { 
      field: 'username', 
      headerName: 'Username',
      align: 'center',
      flex: 1,
      renderCell: (params) => <UserCell params={params} />
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FaEnvelope style={{ marginRight: '8px', color: 'var(--text-secondary)' }} />
          {params.value}
        </Box>
      )
    },
    {
      field: 'role',
      headerName: 'Role',
      flex: 0.75,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={params.value === 'admin' || params.value === 'superAdmin' ? 'primary' : 'default'} 
          variant="outlined"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.75,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit User">
            <IconButton 
              onClick={() => handleEdit(params.row)} 
              color="primary" 
              size="small"
              disabled={isUpdatingUser || editDialogOpen}
            >
              <FaEdit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete User (Not Implemented)">
            <IconButton 
              onClick={() => handleDeleteClick(params.row._id!)} 
              color="error" 
              size="small"
              disabled={isUpdatingUser || editDialogOpen}
            >
              <FaTrash />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];
  
  if (!isMobile) {
    columns.splice(1, 0, { field: 'firstName', headerName: 'First Name', flex: 1 });
    columns.splice(2, 0, { field: 'lastName', headerName: 'Last Name', flex: 1 });
  }

  if (isCurrentUserLoading) {
    return (
      <Box className="loading-indicator-container">
        <CircularProgress />
        <Typography className="loading-indicator-text">Loading your permissions...</Typography>
      </Box>
    );
  }

  if (currentUserError) {
    return <Alert severity="error" className="error-alert-message">Error loading your profile: {currentUserError?.message || 'An unknown error occurred.'}</Alert>;
  }

  if (!currentUserProfile || ((currentUserProfile as User).role !== 'admin' && (currentUserProfile as User).role !== 'superAdmin')) {
    return (
      <Box className="access-denied-container">
        <Typography variant="h4" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1">
          You do not have permission to manage users.
        </Typography>
      </Box>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="account-users-page-container"
    >
      <Typography 
        variant={isMobile ? "h4" : "h2"} 
        gutterBottom 
        className="account-users-title"
      >
        User Management
      </Typography>
      <Box className="account-users-tabs-container">
    
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="user management tabs" 
            variant={isMobile ? "fullWidth" : "standard"}
            indicatorColor="primary"
            textColor="primary"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="All Users" {...a11yProps(0)} />
            <Tab label="Invitations" {...a11yProps(1)} />
          </Tabs>
          <Box className="account-users-invite-button-container">
            <Button
              variant="contained"
              color="secondary"
              startIcon={<FaUserPlus />}
              onClick={() => setNewUserDialog(true)}
            >
              Invite User
            </Button>
          </Box>
      </Box>
      

      <TabPanel value={tabValue} index={0}>
       
          {isLoadingUsers && !usersData.length ? (
            <Box className="loading-indicator-container">
              <CircularProgress />
              <Typography className="loading-indicator-text">Loading users list...</Typography>
            </Box>
          ) : usersError ? (
            <Alert severity="error" className="error-alert-message">Error loading users: {usersError?.message || 'An unknown error occurred.'}</Alert>
          ) : (
            <DataGrid
              className="users-data-grid"
              rows={usersData}
              columns={columns}
              getRowId={(row) => row._id!}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  className: 'custom-data-grid-toolbar',
                  showQuickFilter: false,
                  printOptions: { disableToolbarButton: true },
                  csvOptions: { disableToolbarButton: true },
                }
              }}
              autoHeight
              getRowClassName={(params) =>
                params.indexRelativeToCurrentPage % 2 === 0 ? 'datagrid-row--even' : 'datagrid-row--odd'
              }
            />
          )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <InvitationList refreshTrigger={refreshTrigger} />
      </TabPanel>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid var(--border-color)' }}>Edit User Profile</DialogTitle>
        <DialogContent sx={{ paddingTop: '16px !important' }}>
          {userToEdit && (
            <Box component="form" noValidate autoComplete="off">
              <TextField
                margin="dense"
                label="First Name"
                type="text"
                fullWidth
                variant="outlined"
                name="firstName"
                value={editFormData.firstName || ''}
                onChange={handleFieldChange}
                disabled={isUpdatingUser}
              />
              <TextField
                margin="dense"
                label="Last Name"
                type="text"
                fullWidth
                variant="outlined"
                name="lastName"
                value={editFormData.lastName || ''}
                onChange={handleFieldChange}
                disabled={isUpdatingUser}
              />
              <TextField
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                name="email"
                value={editFormData.email || ''}
                onChange={handleFieldChange}
                disabled={isUpdatingUser}
              />
              <TextField
                margin="dense"
                label="Username (cannot be changed)"
                type="text"
                fullWidth
                variant="outlined"
                name="username"
                value={editFormData.username || ''}
                disabled
              />
              <FormControl fullWidth margin="dense" variant="outlined" disabled={isUpdatingUser}>
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  label="Role"
                  name="role"
                  value={editFormData.role || 'user'}
                  onChange={(e) => handleFieldChange(e as SelectChangeEvent<string>)}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="distributor">Distributor</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="superAdmin">Super Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--border-color)', padding: '16px 24px' }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit" disabled={isUpdatingUser}>Cancel</Button>
          <Button onClick={handleEditSubmit} color="primary" variant="contained" disabled={isUpdatingUser} startIcon={isUpdatingUser ? <CircularProgress size={16} /> : null}>
            {isUpdatingUser ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog - Placeholder */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this user? This action cannot be undone.</Typography>
          <Typography variant="caption" color="error">(Delete functionality not fully implemented)</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      
      {/* Add New User / Send Invitation Dialog */}
      <Dialog open={newUserDialog} onClose={() => setNewUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Add New User / Send Invitation
          <IconButton onClick={() => setNewUserDialog(false)} size="small">
            <FaTimes />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <InvitationForm onInvitationSent={handleInvitationSent} />
        </DialogContent>
      </Dialog>

    </motion.div>
  );
};

export default AccountUsers;