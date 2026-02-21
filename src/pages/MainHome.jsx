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
                bgcolor: "background.default",
                px: 2,
            }}
        >
            <Card sx={{ maxWidth: 400, width: "100%", borderRadius: 3 }}>
                <CardContent
                    sx={{
                        p: 4,
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