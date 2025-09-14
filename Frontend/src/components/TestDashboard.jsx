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
import { getAuth } from 'firebase/auth';

function TestDashboard({ user, token }) {
  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});
  const [shopDomain, setShopDomain] = useState('');
  const [error, setError] = useState('');
  const [storeStatus, setStoreStatus] = useState(null);

  
  const generateOAuthUrl = (shop) => {
    const auth = getAuth();
    const firebaseUid = auth.currentUser?.uid;
    if (!firebaseUid) {
      setError('User not authenticated. Please refresh and try again.');
      return null;
    }
    
    const cleanShopDomain = shop.trim().replace(/\s+/g, '');
    const encodedShop = encodeURIComponent(cleanShopDomain);
    const encodedUid = encodeURIComponent(firebaseUid);
    const oauthUrl = `${import.meta.env.VITE_BACKEND_URL}/shopify/auth?shop=${encodedShop}&firebase_uid=${encodedUid}`;
    
    console.log('Generated OAuth URL:', oauthUrl);
    console.log('Shop domain (cleaned):', cleanShopDomain);
    console.log('Firebase UID:', firebaseUid);
    
    return oauthUrl;
  };

  const openOAuthWindow = (shop) => {
    const oauthUrl = generateOAuthUrl(shop);
    if (oauthUrl) {
      window.open(oauthUrl, '_blank', 'width=600,height=600');
    }
  };

  const checkStoreStatus = async () => {
    if (!shopDomain) {
      setError('Please enter a shop domain');
      return;
    }

    setLoading({ ...loading, status: true });
    setError('');
    
    try {
     
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/store-status?shop=${shopDomain}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setStoreStatus(response.data);
    } catch (err) {
      console.error('Error checking store status:', err);
      setStoreStatus({ error: err.response?.data?.error || err.message });
    } finally {
      setLoading({ ...loading, status: false });
    }
  };

  const handleWebhookAction = async (action) => {
    if (!shopDomain) {
      setError('Please enter a shop domain (e.g., your-store.myshopify.com)');
      return;
    }

    setLoading({ ...loading, [action]: true });
    setError('');
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/${action}-webhooks`,
        { shop: shopDomain },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResults({ ...results, [action]: `✅ ${response.data.message}` });
    } catch (err) {
      console.error(`Error ${action} webhooks:`, err);
      setResults({ ...results, [action]: `❌ Error: ${err.response?.data?.error || err.message}` });
    } finally {
      setLoading({ ...loading, [action]: false });
    }
  };

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
            Shop Configuration & Status
          </Typography>
          <TextField
            fullWidth
            label="Shop Domain"
            placeholder="your-store.myshopify.com"
            value={shopDomain}
            onChange={(e) => {
              
              const value = e.target.value.replace(/\s+/g, '').toLowerCase();
              setShopDomain(value);
            }}
            sx={{ mb: 2 }}
            helperText="Enter the Shopify domain of a connected store (spaces will be automatically removed)"
          />
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              onClick={checkStoreStatus}
              disabled={loading.status}
            >
              {loading.status ? 'Checking...' : 'Check Store Status'}
            </Button>
          </Box>
          
          {storeStatus && (
            <Alert 
              severity={storeStatus.error ? 'error' : 'success'} 
              sx={{ mb: 2 }}
            >
              {storeStatus.error ? (
                <div>
                  <strong>Issue Found:</strong> {storeStatus.error}
                  
                  {storeStatus.needs_oauth && (
                    <Box sx={{ mt: 2 }}>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => {
                          const auth = getAuth();
                          const firebaseUid = auth.currentUser?.uid;
                          if (!firebaseUid) {
                            setError('User not authenticated. Please refresh and try again.');
                            return;
                          }
                          
                          const encodedShop = encodeURIComponent(shopDomain.trim());
                          const encodedUid = encodeURIComponent(firebaseUid);
                          const oauthUrl = `${import.meta.env.VITE_BACKEND_URL}/shopify/auth?shop=${encodedShop}&firebase_uid=${encodedUid}`;
                          console.log('Opening OAuth URL:', oauthUrl);
                          window.open(oauthUrl, '_blank', 'width=600,height=600');
                        }}
                      >
                        Connect Store via OAuth
                      </Button>
                    </Box>
                  )}
                </div>
              ) : (
                <div>
                  <strong>✅ Store Found:</strong> {storeStatus.name}<br/>
                  <strong>Domain:</strong> {storeStatus.shopify_domain}<br/>
                  <strong>Access Token:</strong> {storeStatus.has_access_token ? '✅ Present' : '❌ Missing'}<br/>
                  <strong>Linked to User:</strong> {storeStatus.linked_to_user ? '✅ Yes' : '❌ No'}<br/>
                  <strong>Created:</strong> {new Date(storeStatus.created_at).toLocaleDateString()}
                  {storeStatus.linked_at && (
                    <><br/><strong>Linked:</strong> {new Date(storeStatus.linked_at).toLocaleDateString()}</>
                  )}
                  
                  {(storeStatus.needs_oauth || storeStatus.needs_linking) && (
                    <Box sx={{ mt: 2 }}>
                      <Alert severity="warning" sx={{ mb: 1 }}>
                        {storeStatus.needs_oauth && storeStatus.needs_linking 
                          ? '⚠️ This store needs to be reconnected and linked to your account.'
                          : storeStatus.needs_oauth 
                          ? '⚠️ This store is missing an access token. You need to reconnect it.'
                          : '⚠️ This store exists but is not linked to your account.'
                        }
                      </Alert>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => {
                          const auth = getAuth();
                          const firebaseUid = auth.currentUser?.uid;
                          if (!firebaseUid) {
                            setError('User not authenticated. Please refresh and try again.');
                            return;
                          }
                          
                          const encodedShop = encodeURIComponent(shopDomain.trim());
                          const encodedUid = encodeURIComponent(firebaseUid);
                          const oauthUrl = `${import.meta.env.VITE_BACKEND_URL}/shopify/auth?shop=${encodedShop}&firebase_uid=${encodedUid}`;
                          console.log('Opening OAuth URL:', oauthUrl);
                          window.open(oauthUrl, '_blank', 'width=600,height=600');
                        }}
                      >
                        {storeStatus.needs_oauth ? 'Reconnect Store' : 'Link Store to Account'}
                      </Button>
                    </Box>
                  )}
                </div>
              )}
            </Alert>
          )}
          
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

      {/* Webhook Management Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Webhook Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Register or unregister webhooks for real-time data sync from your Shopify store.
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                color="success"
                startIcon={loading.register ? <CircularProgress size={20} /> : <DownloadIcon />}
                disabled={loading.register}
                onClick={() => handleWebhookAction('register')}
                fullWidth
                sx={{ mb: 1 }}
              >
                {loading.register ? 'Registering...' : 'Register Webhooks'}
              </Button>
              {results.register && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {results.register}
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                color="warning"
                startIcon={loading.unregister ? <CircularProgress size={20} /> : <DownloadIcon />}
                disabled={loading.unregister}
                onClick={() => handleWebhookAction('unregister')}
                fullWidth
                sx={{ mb: 1 }}
              >
                {loading.unregister ? 'Unregistering...' : 'Unregister Webhooks'}
              </Button>
              {results.unregister && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {results.unregister}
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>


    </Box>
  );
}

export default TestDashboard;
