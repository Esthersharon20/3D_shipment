import React from "react";
import { Box, Button, TextField, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    if (data.get("email") && data.get("password")) {
      navigate("/dashboard");
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f4f6f8",
        overflow: "hidden",
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: 360 }}>
        <Typography variant="h5" textAlign="center" mb={2}>
          Login
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField name="email" label="Email" fullWidth margin="normal" />
          <TextField
            name="password"
            label="Password"
            type="password"
            fullWidth
            margin="normal"
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Sign In
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;