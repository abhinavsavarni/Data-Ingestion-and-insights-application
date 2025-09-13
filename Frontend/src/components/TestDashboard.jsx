import React from 'react';
import { Box, Typography, Button } from '@mui/material';

function TestDashboard({ user }) {
  console.log('TestDashboard render - user:', user);
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Test Dashboard
      </Typography>
      <Typography variant="body1">
        This is a simple test dashboard to check if the component renders.
      </Typography>
      <Typography variant="body2" sx={{ mt: 2 }}>
        User: {user ? user.email : 'No user'}
      </Typography>
      <Button variant="contained" sx={{ mt: 2 }}>
        Test Button
      </Button>
    </Box>
  );
}

export default TestDashboard;
