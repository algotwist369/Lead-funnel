import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Typography, Button } from "@mui/material";

const MainHome = () => {
    const navigate = useNavigate();

    const handleRedirect = () => {
        navigate("/login"); 
    };

    return (
        <Box
            sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f8fafc",
        px: { xs: 2, sm: 3 },
        py: 4,
            }}
        >
            <Card
                sx={{
                    maxWidth: 420,
                    width: "100%",
                    borderRadius: 3,
                    boxShadow: "0 18px 45px rgba(15,23,42,0.1)",
                    border: "1px solid rgba(15,23,42,0.06)",
                }}
            >
                <CardContent
                    sx={{
                        p: { xs: 3, sm: 4 },
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        textAlign: "center",
                    }}
                >
                    <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Login To Get Started
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Continue to access your projects and leads dashboard.
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleRedirect}
                        sx={{ borderRadius: 2 }}
                    >
                        Get Started
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
};

export default MainHome;
