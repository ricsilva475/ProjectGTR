import React from 'react';
import { Box, Toolbar, Button, Container } from '@mui/material';
import { Link, Outlet } from 'react-router-dom';
import "./dashboard.css"

const DashboardLayout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Toolbar />
      
      <Container sx={{ mt: 2 }}>
     {/*
        <Box className="button-container">
          
          <Button className="custom-button" component={Link} to="/dashboard">
            Inicio
          </Button>
          <Button className="custom-button" component={Link} to="/dashboard/terrenos">
            Terrenos
          </Button>
          <Button className="custom-button" component={Link} to="/dashboard/vizinhos">
            Vizinhos
          </Button>
          
        </Box>
        */}
        <Outlet />
      
      </Container>
    
    </Box>
  );
};

export default DashboardLayout;
