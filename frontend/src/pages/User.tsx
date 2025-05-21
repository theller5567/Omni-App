import React from 'react';
import { Container, Typography, CircularProgress, Box, Alert, Avatar, Card, CardMedia, CardContent, Tooltip, Chip } from '@mui/material';
import { useParams } from 'react-router-dom';
import { 
    useUserById,
    useMediaByUserId
  } from '../hooks/query-hooks';

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading: isUserLoading, error: userError, isError: isUserError } = useUserById(id);

  const { data: userMedia, isLoading: isMediaLoading, error: mediaError, isError: isMediaError } = useMediaByUserId(user?._id);

  if (isUserLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading user profile...</Typography>
      </Box>
    );
  }

  if (isUserError || !user) {
    const errorMessage = userError?.message || 'User not found or an error occurred.';
    return (
      <Container sx={{ textAlign: 'center', mt: 5 }}>
        <Alert severity="error">{errorMessage}</Alert>
      </Container>
    );
  }

  const getStatusChipColor = (status?: 'pending' | 'approved' | 'rejected' | 'needs_revision'): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'needs_revision':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Avatar 
          src={user.avatar || undefined} 
          sx={{ width: 120, height: 120, margin: '0 auto 2rem auto', fontSize: '3rem' }}
        >
          {(!user.avatar && user.firstName && user.lastName) ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : user.username?.charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant="h2" gutterBottom>{user.username}</Typography>
        {user.firstName && user.lastName && (
          <Typography variant="h4" color="textSecondary" gutterBottom>
            {`${user.firstName} ${user.lastName}`}
          </Typography>
        )}
        <Typography variant="body1" color="textSecondary">
          Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
        </Typography>
      </Box>

      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, textAlign: 'center' }}>
        Media Uploaded by {user.username}
      </Typography>
      {isMediaLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" height="20vh">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading media...</Typography>
        </Box>
      )}
      {isMediaError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {mediaError?.message || 'An error occurred while fetching media.'}
        </Alert>
      )}
      {!isMediaLoading && !isMediaError && userMedia && userMedia.length === 0 && (
        <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
          This user has not uploaded any media yet.
        </Typography>
      )}
      {!isMediaLoading && !isMediaError && userMedia && userMedia.length > 0 && (
        <Box 
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)', // 1 column on extra-small screens
              sm: 'repeat(2, 1fr)', // 2 columns on small screens
              md: 'repeat(3, 1fr)', // 3 columns on medium screens
            },
            gap: 3, // Corresponds to MUI spacing(3)
          }}
        >
          {userMedia.map((media) => (
            // Each Card is now a direct grid item
            <Card key={media._id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="140"
                image={media.metadata?.v_thumbnail || media.location || '/placeholder-image.jpg'} 
                alt={media.title || media.metadata?.fileName || 'Media item'}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div" noWrap>
                  {media.title || media.metadata?.fileName}
                </Typography>
                {media.approvalStatus && media.approvalStatus !== 'approved' && (
                  <Tooltip title={media.approvalFeedback || media.approvalStatus?.replace('_', ' ')} placement="top">
                    <Chip
                      label={media.approvalStatus.replace('_', ' ')}
                      color={getStatusChipColor(media.approvalStatus)}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Tooltip>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default UserPage;