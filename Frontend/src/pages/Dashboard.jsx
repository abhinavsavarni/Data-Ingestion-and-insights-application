import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Grid, Paper, TextField, MenuItem, Stack, Chip, Divider, Button } from "@mui/material";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { auth } from "../firebase";
import StoreSelector from "../components/StoreSelector";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F"]; 

function Dashboard({ user }) {
  const [metrics, setMetrics] = useState({
    customers: 0,
    orders: 0,
    revenue: 0,
    aov: 0,
    repeatRate: 0,
    topCustomers: [],
    ordersByDate: [],
    trends: [],
  });
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [granularity, setGranularity] = useState("daily");
  const [selectedStore, setSelectedStore] = useState(null);
  const [showStoreSelector, setShowStoreSelector] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStoreSelect = (store) => {
    console.log('Store selected:', store);
    console.log('Store domain:', store?.shopify_domain);
    console.log('Store name:', store?.name);
    setSelectedStore(store);
    setShowStoreSelector(false);
  };

  useEffect(() => {
    async function fetchMetrics() {
      if (!selectedStore) {
        console.log('No store selected, skipping metrics fetch');
        return;
      }
      
      console.log('Fetching metrics for store:', selectedStore.shopify_domain);
      setLoading(true);
      setError(null);
      
      try {
        // Temporary: use test token for debugging
        const token = "test-token"; // await auth.currentUser.getIdToken();
        console.log('Using test token, making API call...');
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/metrics`, {
          params: { shop: selectedStore.shopify_domain, ...dateRange },
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Metrics response:', res.data);
        setMetrics(res.data);
      } catch (err) {
        console.error("Error fetching metrics:", err);
        setError('Failed to load metrics. Using demo data.');
        setMetrics({
          customers: 120,
          orders: 85,
          revenue: 15400,
          aov: 181.18,
          repeatRate: 0.34,
          topCustomers: [
            { name: "Alice", spend: "3200" },
            { name: "Bob", spend: "2900" },
            { name: "Carol", spend: "2100" },
            { name: "Dave", spend: "1800" },
            { name: "Eve", spend: "1600" },
          ],
          ordersByDate: [
            { date: "2024-01-01", orders: 10 },
            { date: "2024-01-02", orders: 20 },
            { date: "2024-01-03", orders: 13 },
          ],
          trends: [
            { date: "2024-01-01", revenue: "2000" },
            { date: "2024-01-02", revenue: "5000" },
            { date: "2024-01-03", revenue: "3200" },
          ],
        });
      } finally {
        setLoading(false);
      }
    }

    if (user && selectedStore) {
      fetchMetrics();
    }
  }, [dateRange, user, selectedStore]);

  const pieData = useMemo(() => {
    try {
      return metrics.topCustomers.map((c) => ({ name: c.name, value: Number(c.spend || 0) }));
    } catch (err) {
      console.error('Error creating pie data:', err);
      return [];
    }
  }, [metrics.topCustomers]);

  console.log('Dashboard render - showStoreSelector:', showStoreSelector, 'selectedStore:', selectedStore, 'user:', user);

  if (showStoreSelector) {
    console.log('Rendering store selector');
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <StoreSelector onStoreSelect={handleStoreSelect} selectedStore={selectedStore} />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard - {selectedStore?.name}
        </Typography>
        <Typography>Loading metrics...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard - {selectedStore?.name}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => setShowStoreSelector(true)}
        >
          Switch Store
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
          <Typography color="warning.contrastText">{error}</Typography>
        </Box>
      )}

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              label="Start date"
              type="date"
              fullWidth
              value={dateRange.start}
              onChange={(e) => setDateRange((r) => ({ ...r, start: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="End date"
              type="date"
              fullWidth
              value={dateRange.end}
              onChange={(e) => setDateRange((r) => ({ ...r, end: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select label="Granularity" value={granularity} onChange={(e) => setGranularity(e.target.value)} fullWidth>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly" disabled>
                Weekly
              </MenuItem>
              <MenuItem value="monthly" disabled>
                Monthly
              </MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Chip label="Last 7d" onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 6);
                setDateRange({ start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) });
              }} />
              <Chip label="Last 30d" onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 29);
                setDateRange({ start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) });
              }} />
              <Chip label="YTD" onClick={() => {
                const end = new Date();
                const start = new Date(end.getFullYear(), 0, 1);
                setDateRange({ start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) });
              }} />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Metric cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">Customers</Typography>
            <Typography variant="h4">{metrics.customers}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">Orders</Typography>
            <Typography variant="h4">{metrics.orders}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">Revenue</Typography>
            <Typography variant="h4">₹{Number(metrics.revenue).toLocaleString('en-IN')}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">Avg Order Value</Typography>
            <Typography variant="h4">₹{Number(metrics.aov).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={1} sx={{ p: 2, height: 360 }}>
            <Typography variant="h6" gutterBottom>Revenue trend</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.trends}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 2, height: 360 }}>
            <Typography variant="h6" gutterBottom>Top customers</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie dataKey="value" data={pieData} outerRadius={100} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, height: 360 }}>
            <Typography variant="h6" gutterBottom>Orders by date</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.ordersByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, height: 360 }}>
            <Typography variant="h6" gutterBottom>Loyalty & health</Typography>
            <Stack direction="row" spacing={4} alignItems="center" sx={{ p: 2 }}>
              <Box>
                <Typography variant="overline" color="text.secondary">Repeat purchase rate</Typography>
                <Typography variant="h4">{(Number(metrics.repeatRate) * 100).toFixed(0)}%</Typography>
              </Box>
              <Divider flexItem orientation="vertical" />
              <Box>
                <Typography variant="overline" color="text.secondary">AOV</Typography>
                <Typography variant="h4">₹{Number(metrics.aov).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
              </Box>
            </Stack>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={metrics.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#ff9800" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
