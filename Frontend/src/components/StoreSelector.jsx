import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  Grid, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { Add as AddIcon, Store as StoreIcon } from '@mui/icons-material';
import axios from 'axios';
import { getAuth } from 'firebase/auth';

function StoreSelector({ onStoreSelect, selectedStore, token }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [newStoreDomain, setNewStoreDomain] = useState('');

  console.log('StoreSelector component initialized');

  useEffect(() => {
    if (token) {
      fetchStores();
    }
  }, [token]);

  const fetchStores = async () => {
    try {
      console.log('Fetching stores with Firebase token...');
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/stores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Stores response:', response.data);
      setStores(response.data.stores || []);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError('Failed to load stores: ' + err.message);
      setStores([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStore = async () => {
    if (!newStoreDomain) return;
    
    try {
      console.log('Connecting store with Firebase token...');
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/connect-store`, 
        { shop: newStoreDomain },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowConnectDialog(false);
      setNewStoreDomain('');
      fetchStores();
    } catch (err) {
      console.error('Error connecting store:', err.response?.data || err.message);
      setError('Failed to connect store');
    }
  };

  const handleShopifyOAuth = (storeDomain) => {
    // Get Firebase UID and pass it to OAuth flow
    const auth = getAuth();
    const firebaseUid = auth.currentUser?.uid;
    
    if (!firebaseUid) {
      setError('User not authenticated. Please refresh and try again.');
      return;
    }
    
    const oauthUrl = `${import.meta.env.VITE_BACKEND_URL}/shopify/auth?shop=${storeDomain}&firebase_uid=${firebaseUid}`;
    window.open(oauthUrl, '_blank', 'width=600,height=600');
  };

  console.log('StoreSelector render - loading:', loading, 'stores:', stores, 'error:', error);

  if (loading) {
    console.log('Rendering loading state');
    return (
      <Box>
        <Typography>Loading stores...</Typography>
      </Box>
    );
  }

  console.log('Rendering store selector with', stores.length, 'stores');
  
  try {
    return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Select Store</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setShowConnectDialog(true)}
        >
          Connect Store
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!stores || stores.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <StoreIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No stores connected
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Connect your first Shopify store to get started
            </Typography>
            <Button
              variant="contained"
              onClick={() => setShowConnectDialog(true)}
              startIcon={<AddIcon />}
            >
              Connect Store
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {stores.map((store) => (
            <Grid item xs={12} sm={6} md={4} key={store.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: selectedStore?.id === store.id ? 2 : 1,
                  borderColor: selectedStore?.id === store.id ? 'primary.main' : 'divider',
                  '&:hover': { boxShadow: 3 }
                }}
                onClick={() => onStoreSelect(store)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <StoreIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" noWrap>
                      {store.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {store.shopify_domain}
                  </Typography>
                  <Chip 
                    label={`Connected ${new Date(store.connected_at).toLocaleDateString()}`}
                    size="small"
                    color="success"
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={showConnectDialog} onClose={() => setShowConnectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connect a Store</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the domain of a Shopify store that has already been set up with our app.
          </Typography>
          <TextField
            fullWidth
            label="Store Domain"
            placeholder="your-store.myshopify.com"
            value={newStoreDomain}
            onChange={(e) => setNewStoreDomain(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Don't have a store set up yet?{' '}
            <Button
              size="small"
              onClick={() => {
                setShowConnectDialog(false);
                handleShopifyOAuth(newStoreDomain || 'your-store.myshopify.com');
              }}
            >
              Set up new store
            </Button>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConnectDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleConnectStore} 
            variant="contained"
            disabled={!newStoreDomain}
          >
            Connect
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    );
  } catch (err) {
    console.error('Error rendering StoreSelector:', err);
    return (
      <Box>
        <Typography color="error">Error loading store selector: {err.message}</Typography>
      </Box>
    );
  }
}

export default StoreSelector;
