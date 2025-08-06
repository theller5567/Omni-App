import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  Skeleton
} from '@mui/material';
import { 
  useUserActivities, 
  useAllUsers, 
  useUserProfile,
  User as UserType 
} from '../../hooks/query-hooks';

// User activity interface - ensure this matches the data from fetchUserActivities
interface UserActivityEntry {
  _id: string; // Assuming API returns _id
  userId: string;
  username?: string; // Make optional if not always present
  email?: string;    // Make optional
  action: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  // Add other fields as returned by your API
  details?: string | { message?: string; [key: string]: any }; // Allow details to be string or object
  targetId?: string;
  targetType?: string;
}

const UserActivity: React.FC = () => {
  const [page, setPage] = useState(0); // API is 1-indexed, UI is 0-indexed for MUI TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Get userProfile for enabling the query
  const { data: userProfile } = useUserProfile();

  // Use TanStack Query hooks
  const { 
    data: activityData, // Contains { data: UserActivityEntry[], total: number }
    isLoading,
    isError,
    error,
    // refetch // Can be used for manual refetching if needed
  } = useUserActivities(userProfile, page + 1, rowsPerPage); // Pass userProfile and 1-indexed page

  const { data: allUsers = [], isLoading: isLoadingUsers } = useAllUsers();

  // Extracted activities and total count
  const activities = activityData?.data || [];
  const total = activityData?.total || 0;

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when rows per page changes
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'LOGIN': return 'success';
      case 'LOGOUT': return 'default';
      case 'CREATE':
      case 'UPLOAD': return 'primary';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      case 'PASSWORD_CHANGE': return 'warning';
      case 'PROFILE_UPDATE': return 'secondary';
      default: return 'default';
    }
  };

  // Find user details for a given activity
  const getUserForActivity = (userId: string): UserType | undefined => {
    return allUsers.find(user => user._id === userId || user.id === userId);
  };

  // Helper to render activity.details safely
  const renderActivityDetailsString = (details: string | { message?: string;[key: string]: any } | undefined): string => {
    if (typeof details === 'string') {
      return details;
    }
    if (typeof details === 'object' && details !== null) {
      if (details.message && typeof details.message === 'string') {
        return details.message;
      }
      return JSON.stringify(details);
    }
    return 'N/A';
  };

  if (isLoading || isLoadingUsers) {
    return (
      <Paper sx={{ padding: 2, textAlign: 'center' }}>
        <Skeleton />
        <Typography sx={{ mt: 1 }}>Loading user activities...</Typography>
      </Paper>
    );
  }

  if (isError) {
    return (
      <Paper sx={{ padding: 2, textAlign: 'center' }}>
        <Typography color="error">
          Error loading user activities: {error instanceof Error ? error.message : 'Unknown error'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ padding: 2, marginTop: 2 }}>
      <Typography variant="h6" gutterBottom>User Activity Logs</Typography>
      {activities.length === 0 && !isLoading ? (
        <Typography sx={{ textAlign: 'center', p: 2 }}>No user activities found.</Typography>
      ) : (
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell><TableCell>Action</TableCell><TableCell>Details</TableCell><TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.map((activity: UserActivityEntry) => {
                const user = getUserForActivity(activity.userId);
                const userDisplayName = user?.username || user?.email || activity.username || activity.userId;
                const avatarText = user?.firstName && user?.lastName 
                                  ? `${user.firstName[0]}${user.lastName[0]}` 
                                  : userDisplayName.substring(0, 2).toUpperCase();
                return (
                  <TableRow hover key={activity._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 30, height: 30, mr: 1, fontSize: '0.8rem' }} src={user?.avatar}>
                          {avatarText}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{userDisplayName}</Typography>
                          {user?.email && <Typography variant="caption" color="textSecondary">{user.email}</Typography>}
                          {!user && activity.email && <Typography variant="caption" color="textSecondary">{activity.email}</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={activity.action}
                        size="small"
                        color={getActionColor(activity.action)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">IP: {activity.ip || 'N/A'}</Typography>
                      <Typography variant="caption" display="block">Agent: {activity.userAgent ? activity.userAgent.substring(0, 50) + '...' : 'N/A'}</Typography>
                      {activity.targetType && activity.targetId && 
                        <Typography variant="caption" display="block">Target: {activity.targetType} ({activity.targetId.substring(0,8)}...)</Typography>}
                      {activity.details && <Typography variant="caption" display="block">{renderActivityDetailsString(activity.details)}</Typography>}
                    </TableCell>
                    <TableCell>{formatTimestamp(activity.timestamp)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={total} // Use total count from API response
        rowsPerPage={rowsPerPage}
        page={page} // UI page is 0-indexed
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default UserActivity; 