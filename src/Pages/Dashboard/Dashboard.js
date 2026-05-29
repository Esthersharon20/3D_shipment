import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "../../Components";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  CircularProgress,
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AddIcon from "@mui/icons-material/Add";
import ViewListIcon from "@mui/icons-material/ViewList";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";

const DRAFTS_KEY = "shipmentDrafts";

const StatCard = ({ label, value, icon, bg }) => (
  <Card
    sx={{
      height: "100%",
      minHeight: 95,
      borderRadius: 2,
      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      display: "flex",
      alignItems: "center",
    }}
  >
    <CardContent
      sx={{
        width: "100%",
        p: 2.5,
        "&:last-child": { pb: 2.5 },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ width: "100%" }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: "13px",
              color: "#7a7a7a",
              fontWeight: 500,
              letterSpacing: "0.4px",
              mb: 1,
            }}
          >
            {label}
          </Typography>

          <Typography
            sx={{
              fontSize: "34px",
              fontWeight: 700,
              lineHeight: 1,
              color: "#111",
            }}
          >
            {value}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 1.5,
            backgroundColor: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const ActionCard = ({ title, subtitle, icon, onClick }) => (
  <Card
    onClick={onClick}
    sx={{
      height: "100%",
      borderRadius: 2,
      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      cursor: "pointer",
      transition: "0.25s",
      "&:hover": {
        boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
        transform: "translateY(-2px)",
      },
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            backgroundColor: "#f4f6f8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>

        <Box>
          <Typography fontWeight={600}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();

  const [shipments, setShipments] = useState([]);
  const [localDrafts, setLocalDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleCreateShipment = () => {
    navigate("/cargo-config");
  };

  const loadLocalDrafts = () => {
    try {
      const raw = localStorage.getItem(DRAFTS_KEY);
      if (!raw) {
        setLocalDrafts([]);
        return;
      }

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        setLocalDrafts(parsed);
      } else {
        setLocalDrafts(Object.values(parsed));
      }
    } catch {
      setLocalDrafts([]);
    }
  };

  const loadShipments = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/shipments");
      const data = await res.json();
      setShipments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load shipments:", error);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
    loadLocalDrafts();
  }, []);

  const dashboardData = useMemo(() => {
    const dbNames = new Set(
      shipments.map((s) => (s.name || "").trim().toLowerCase())
    );

    const uniqueDrafts = localDrafts.filter(
      (d) => !dbNames.has((d.name || "").trim().toLowerCase())
    );

    const completedShipments = shipments.filter(
      (s) => String(s.status || "").toLowerCase() === "completed"
    );

    const draftShipments = [
      ...shipments.filter(
        (s) => String(s.status || "").toLowerCase() === "draft"
      ),
      ...uniqueDrafts.map((d) => ({
        id: d.id || `draft-${d.name}`,
        name: d.name || "Untitled Draft",
        status: "draft",
        item_count: d.item_count || 0,
        container_count: 0,
        created_at: d.created_at,
        _isLocalDraft: true,
        _draftForm: d.form || null,
      })),
    ];

    const allShipments = [...completedShipments, ...draftShipments].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

    return {
      totalShipments: allShipments.length,
      draftShipments: draftShipments.length,
      completedShipments: completedShipments.length,
      recentShipments: allShipments.slice(0, 5),
    };
  }, [shipments, localDrafts]);

  const formatDate = (ts) => {
    if (!ts) return "-";
    const d = new Date(ts);
    return (
      d.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " " +
      d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  const handleOpenShipment = (shipment) => {
    if (shipment._isLocalDraft) {
      navigate("/cargo-config", {
        state: { resumeDraft: shipment._draftForm || null },
      });
    } else {
      navigate("/cargo-list", {
        state: { viewShipmentName: shipment.name },
      });
    }
  };

  return (
    <SidebarLayout title="Dashboard">
      <Stack direction="row" spacing={1.5} alignItems="center" mb={4}>
        <HomeIcon color="primary" />
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Dashboard
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} alignItems="stretch" mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            label="TOTAL SHIPMENTS"
            value={loading ? "..." : dashboardData.totalShipments}
            icon={<Inventory2OutlinedIcon fontSize="small" />}
            bg="#e8f0fe"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            label="DRAFT SHIPMENTS"
            value={loading ? "..." : dashboardData.draftShipments}
            icon={<DescriptionOutlinedIcon fontSize="small" />}
            bg="#fff4e5"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            label="COMPLETED SHIPMENTS"
            value={loading ? "..." : dashboardData.completedShipments}
            icon={<CheckCircleOutlineIcon fontSize="small" />}
            bg="#e6f4ea"
          />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.2} alignItems="center" mb={2}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            background: "linear-gradient(135deg, #e8f0fe, #f4f6f8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AddIcon sx={{ fontSize: 18, color: "#1976d2" }} />
        </Box>

        <Typography fontWeight={700} fontSize="1.05rem">
          Quick Actions
        </Typography>
      </Stack>

      <Grid
        container
        spacing={3}
        alignItems="stretch"
        sx={{
          width: "100%",
          justifyContent: "flex-start",
          mb: 4,
        }}
      >
        <Grid item xs={12} sm={6} md={4}>
          <ActionCard
            title="New Shipment"
            subtitle="Create a new cargo shipment"
            icon={<AddIcon />}
            onClick={handleCreateShipment}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <ActionCard
            title="All Shipments"
            subtitle="View and manage shipments"
            icon={<ViewListIcon />}
            onClick={() => navigate("/shipments")}
          />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.2} alignItems="center" mb={2}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            background: "linear-gradient(135deg, #e6f4ea, #f4f6f8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LocalShippingOutlinedIcon sx={{ fontSize: 18, color: "#2e7d32" }} />
        </Box>

        <Typography fontWeight={700} fontSize="1.05rem">
          Recent Shipments
        </Typography>
      </Stack>

      <Card
        sx={{
          borderRadius: 2,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box
              sx={{
                py: 5,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress size={28} />
            </Box>
          ) : dashboardData.recentShipments.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary">
                No shipments available yet.
              </Typography>
            </Box>
          ) : (
            dashboardData.recentShipments.map((shipment, index) => (
<Box
  key={shipment.id || index}
  sx={{
    px: 3,
    py: 2,
    borderBottom:
      index !== dashboardData.recentShipments.length - 1
        ? "1px solid #f0f0f0"
        : "none",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 1.5,
  }}
>
                <Box>
                  <Typography fontWeight={600}>
                    {shipment.name || "Untitled Shipment"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Items: {shipment.item_count || 0} | Containers:{" "}
                    {shipment.container_count || 0}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color:
                        shipment.status === "completed" ? "#2e7d32" : "#ed6c02",
                    }}
                  >
                    {shipment.status === "completed" ? "Completed" : "Draft"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(shipment.created_at)}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </SidebarLayout>
  );
};

export default Dashboard;