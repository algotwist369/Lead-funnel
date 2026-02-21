import React, { useState } from "react";
import {
    Box,
    Typography,
    Radio,
    RadioGroup,
    FormControlLabel,
} from "@mui/material";

const QuestionPage = () => {
    const [selected, setSelected] = useState("");

    const options = [
        "Within 1 week",
        "Within 15 days",
        "Within a month",
        "Just exploring options",
    ];

    return (
        <Box
            sx={{
                height: "100vh",
                width: "100%",
                backgroundImage:
                    "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                color: "#fff",
            }}
        >
            {/* Dark Overlay */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.65)",
                }}
            />

            {/* Content */}
            <Box
                sx={{
                    position: "relative",
                    zIndex: 2,
                    textAlign: "center",
                    maxWidth: 600,
                    width: "90%",
                }}
            >
                {/* Question */}
                <Typography variant="h5" sx={{ mb: 1, opacity: 0.8 }}>
                    5 →
                </Typography>

                <Typography
                    variant="h4"
                    fontWeight="bold"
                    sx={{ mb: 2 }}
                >
                    When do you plan to schedule a site visit for your future home?
                </Typography>

                <Typography sx={{ mb: 4, opacity: 0.7 }}>
                    Please select your answer
                </Typography>

                {/* Options */}
                <RadioGroup
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                >
                    {options.map((option, index) => (
                        <FormControlLabel
                            key={index}
                            value={option}
                            control={<Radio sx={{ display: "none" }} />}
                            label={option}
                            sx={{
                                mb: 2,
                                mx: "auto",
                                width: "100%",
                                borderRadius: "30px",
                                border: "1px solid rgba(255,255,255,0.5)",
                                padding: "12px 20px",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                backgroundColor:
                                    selected === option
                                        ? "rgba(255,255,255,0.2)"
                                        : "transparent",
                                "&:hover": {
                                    backgroundColor: "rgba(255,255,255,0.15)",
                                },
                            }}
                        />
                    ))}
                </RadioGroup>
            </Box>
        </Box>
    );
};

export default QuestionPage;
