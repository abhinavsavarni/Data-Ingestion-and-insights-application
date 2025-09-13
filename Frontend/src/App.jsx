import React from 'react';
import { ThemeProvider, CssBaseline, Container, Box, Typography } from '@mui/material';
import theme from './theme';
import Dashboard from './pages/Dashboard';
import TestDashboard from './components/TestDashboard';
import Auth from './pages/Auth';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [user, setUser] = React.useState(null);

  console.log('App render - user:', user);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
            <Typography variant="h3" align="center" gutterBottom>
              Shopify Data Dashboard
            </Typography>
            {user ? <Dashboard user={user} /> : <Auth onLogin={setUser} />}
          </Box>
        </Container>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
