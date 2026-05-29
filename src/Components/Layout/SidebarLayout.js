import React, { useState } from "react";
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Tooltip, Divider,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import DirectionsBoatIcon from "@mui/icons-material/DirectionsBoat";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import SettingsIcon from "@mui/icons-material/Settings";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import LogoutIcon from "@mui/icons-material/Logout";
import { useLocation, useNavigate } from "react-router-dom";

const COLLAPSED_WIDTH = 64;
const EXPANDED_WIDTH = 240;

const menuItems = [
  { text: "Dashboard",   icon: <DashboardIcon />,      path: "/dashboard" },
  { text: "Shipments",   icon: <DirectionsBoatIcon />, path: "/shipments" },
  { text: "Cost Analysis", icon: <AttachMoneyIcon />,    path: "/cost-analysis" },

];

const SidebarLayout = ({ children, title }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Drawer
        variant="permanent"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        sx={{
          width: open ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
          "& .MuiDrawer-paper": {
            width: open ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
            transition: "width 0.25s ease",
            overflowX: "hidden",
            background: "linear-gradient(180deg, #1e88e5, #0d47a1)",
            color: "#fff",
            borderRight: "none",
          },
        }}
      >
        <Toolbar sx={{ justifyContent: open ? "flex-start" : "center" }}>
          <Typography variant="h6" sx={{ opacity: open ? 1 : 0, transition: "opacity 0.2s", whiteSpace: "nowrap", fontWeight: 600 }}>
            Shipment 3D
          </Typography>
        </Toolbar>

        <List sx={{ flexGrow: 1 }}>
          {menuItems.map((item) => (
            <Tooltip key={item.text} title={!open ? item.text : ""} placement="right">
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  mx: 1, my: 0.5, borderRadius: 1,
                  justifyContent: open ? "flex-start" : "center",
                  "&.Mui-selected": { backgroundColor: "rgba(255,255,255,0.18)" },
                }}
              >
                <ListItemIcon sx={{ color: "#fff", minWidth: 0, mr: open ? 2 : "auto", justifyContent: "center" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0, transition: "opacity 0.2s" }} />
              </ListItemButton>
            </Tooltip>
          ))}
        </List>

        <Divider sx={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <LogoutIcon
            onClick={() => navigate("/")}
            sx={{ color: "#fff", cursor: "pointer", opacity: 0.85, "&:hover": { opacity: 1, transform: "scale(1.15)" }, transition: "all 0.2s ease" }}
          />
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ height: 64, px: 3, display: "flex", alignItems: "center", backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
          <Typography variant="h6" fontWeight={600}>{title}</Typography>
        </Box>
        <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: "#f4f6f8", overflow: "auto" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default SidebarLayout;