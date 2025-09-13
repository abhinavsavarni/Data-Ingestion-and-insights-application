import React, { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { Box, Button, TextField, Typography, Paper, Grid, InputAdornment, IconButton, Link } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

function Auth({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    console.log('Auth attempt - isSignup:', isSignup, 'email:', email);
    setLoading(true);
    try {
      let userCredential;
      if (isSignup) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      console.log('Auth successful, user:', userCredential.user);
      onLogin(userCredential.user); // Pass user back to App.jsx
    } catch (err) {
      console.error("Auth error:", err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = /.+@.+\..+/.test(email);
  const isPasswordValid = password.length >= 6;
  const canSubmit = isEmailValid && isPasswordValid && !loading;

  return (
    <Grid container spacing={2} alignItems="stretch">
      <Grid item xs={12} md={6}>
        <Paper elevation={3} sx={{ p: 4, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {isSignup ? "Create your account" : "Welcome back"}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isSignup ? "Sign up to connect your Shopify store and get insights." : "Login to view your Shopify business performance."}
            </Typography>
          </Box>

          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            sx={{ my: 1 }}
            error={email !== "" && !isEmailValid}
            helperText={email !== "" && !isEmailValid ? "Enter a valid email" : ""}
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            sx={{ my: 1 }}
            error={password !== "" && !isPasswordValid}
            helperText={password !== "" && !isPasswordValid ? "Minimum 6 characters" : ""}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((s) => !s)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button variant="contained" size="large" onClick={handleAuth} disabled={!canSubmit} sx={{ my: 2 }}>
            {loading ? (isSignup ? "Signing up..." : "Logging in...") : isSignup ? "Sign Up" : "Login"}
          </Button>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {isSignup ? "Already have an account? " : "No account? "}
            <Link component="button" onClick={() => setIsSignup(!isSignup)} underline="hover">
              {isSignup ? "Login" : "Sign up"}
            </Link>
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 4 }}>
            By continuing you agree to our Terms and Privacy Policy.
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Box
          sx={{
            height: "100%",
            borderRadius: 2,
            p: 4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            color: "#fff",
          }}
        >
          <Typography variant="h3" fontWeight={800} gutterBottom>
            Shopify Insights
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Visualize your customers, orders, and revenue in real-time.
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              • Secure Firebase authentication
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              • Beautiful charts and performance trends
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              • Date range filtering and top customer insights
            </Typography>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}

export default Auth;
