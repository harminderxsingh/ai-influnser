import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Divider,
  Fade,
  alpha,
  useTheme,
} from "@mui/material";
import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  AutoAwesomeOutlined,
} from "@mui/icons-material";

const Step3 = ({
  lang,
  creationType,
  name,
  description,
  prompt,
  photoPreview,
}) => {
  const theme = useTheme();

  const getCreationTypeIcon = (type) => {
    return type === "prompt" ? (
      <AutoAwesomeOutlined sx={{ fontSize: 14 }} />
    ) : (
      <CloudUploadOutlined sx={{ fontSize: 14 }} />
    );
  };

  return (
    <Fade in timeout={500}>
      <Box>
        <Box
          sx={{
            textAlign: "center",
            mb: 4,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.success.main, 0.1),
              mx: "auto",
              mb: 2,
            }}
          >
            <CheckCircleOutlined
              sx={{ fontSize: 40, color: theme.palette.success.main }}
            />
          </Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {lang.reviewYourCharacter || "Review Your Character"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {lang.reviewDetails || "Please review the details before creating"}
          </Typography>
        </Box>

        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Grid container spacing={3}>
            {/* Preview */}
            {photoPreview && (
              <Grid item xs={12} sx={{ textAlign: "center" }}>
                <Avatar
                  src={photoPreview}
                  sx={{
                    width: 150,
                    height: 150,
                    margin: "0 auto",
                    boxShadow: `0 8px 24px ${alpha(
                      theme.palette.common.black,
                      0.15,
                    )}`,
                  }}
                />
              </Grid>
            )}

            {/* Details */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {lang.creationMethod || "Creation Method"}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 0.5,
                  }}
                >
                  {getCreationTypeIcon(creationType)}
                  <Typography variant="body1" fontWeight={600}>
                    {creationType === "prompt"
                      ? lang.aiGenerated || "AI Generated"
                      : lang.uploaded || "Photo Upload"}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {lang.characterName || "Character Name"}
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                  {name || lang.notSpecified || "Not specified"}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {lang.characterDescription || "Description"}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {description ||
                    lang.noDescriptionProvided ||
                    "No description provided"}
                </Typography>
              </Box>

              {creationType === "prompt" && prompt && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      {lang.aiPrompt || "AI Prompt"}
                    </Typography>
                    <Paper
                      sx={{
                        p: 2,
                        mt: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontFamily: "monospace", lineHeight: 1.8 }}
                      >
                        {prompt}
                      </Typography>
                    </Paper>
                  </Box>
                </>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Fade>
  );
};

export default Step3;
