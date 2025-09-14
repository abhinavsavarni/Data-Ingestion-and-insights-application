import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Alert,
  CircularProgress,
  TextField
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  People as PeopleIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import axios from 'axios';

function TestDashboard({ user, token }) {
  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});
  const [shopDomain, setShopDomain] = useState('');
  const [error, setError] = useState('');

  const handleIngest = async (type) => {
    if (!shopDomain) {
      setError('Please enter a shop domain (e.g., your-store.myshopify.com)');
      return;
    }

    setLoading({ ...loading, [type]: true });
    setError('');
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/ingest/${type}`,
        { shop: shopDomain },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResults({ ...results, [type]: `✅ ${response.data}` });
    } catch (err) {
      console.error(`Error ingesting ${type}:`, err);
      setResults({ ...results, [type]: `❌ Error: ${err.response?.data || err.message}` });
    } finally {
      setLoading({ ...loading, [type]: false });
    }
  };

  console.log('TestDashboard render - user:', user);
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Manual Data Ingestion Test
      </Typography>
      <Typography variant="body1" gutterBottom>
        Use this to manually pull data from your Shopify store to test the integration.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Shop Configuration
          </Typography>
          <TextField
            fullWidth
            label="Shop Domain"
            placeholder="your-store.myshopify.com"
            value={shopDomain}
            onChange={(e) => setShopDomain(e.target.value)}
            sx={{ mb: 2 }}
            helperText="Enter the Shopify domain of a connected store"
          />
          <Typography variant="body2" color="text.secondary">
            User: {user ? user.email : 'No user'} | Token: {token ? 'Present' : 'Missing'}
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Customers
              </Typography>
              <Button
                variant="contained"
                startIcon={loading.customers ? <CircularProgress size={20} /> : <DownloadIcon />}
                disabled={loading.customers}
                onClick={() => handleIngest('customers')}
                fullWidth
              >
                {loading.customers ? 'Ingesting...' : 'Ingest Customers'}
              </Button>
              {results.customers && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {results.customers}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <InventoryIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Products
              </Typography>
              <Button
                variant="contained"
                startIcon={loading.products ? <CircularProgress size={20} /> : <DownloadIcon />}
                disabled={loading.products}
                onClick={() => handleIngest('products')}
                fullWidth
              >
                {loading.products ? 'Ingesting...' : 'Ingest Products'}
              </Button>
              {results.products && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {results.products}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShoppingCartIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Orders
              </Typography>
              <Button
                variant="contained"
                startIcon={loading.orders ? <CircularProgress size={20} /> : <DownloadIcon />}
                disabled={loading.orders}
                onClick={() => handleIngest('orders')}
                fullWidth
              >
                {loading.orders ? 'Ingesting...' : 'Ingest Orders'}
              </Button>
              {results.orders && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {results.orders}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <DownloadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                All Data
              </Typography>
              <Button
                variant="outlined"
                disabled={Object.values(loading).some(l => l)}
                onClick={async () => {
                  await handleIngest('customers');
                  await handleIngest('products');
                  await handleIngest('orders');
                }}
                fullWidth
              >
                Ingest All
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Next Steps: Set Up Webhooks
          </Typography>
          <Typography variant="body2" paragraph>
            After testing manual ingestion, you'll want to set up webhooks for real-time data sync.
            This requires configuring webhook URLs in your Shopify app settings.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default TestDashboard;
