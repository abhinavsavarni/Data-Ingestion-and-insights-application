import React from 'react';
import { ThemeProvider, CssBaseline, Container, Box, Typography } from '@mui/material';
import theme from './theme';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [user, setUser] = React.useState(null);
  const [token, setToken] = React.useState(null);

  console.log('App render - user:', user, 'token:', token ? '[set]' : '[null]');

 
  const handleLogin = (user, token) => {
    setUser(user);
    setToken(token);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
            <Typography variant="h3" align="center" gutterBottom>
              Shopify Data Dashboard
            </Typography>
            {user ? (
              <Dashboard user={user} token={token} />
            ) : (
              <Auth onLogin={handleLogin} />
            )}
          </Box>
        </Container>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
