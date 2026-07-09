import React from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Avatar,
  Button,
  Fade,
  alpha,
  useTheme,
} from "@mui/material";
import { CloudUploadOutlined } from "@mui/icons-material";
import PromptExamples from "./PromptExamples";

const Step2 = ({
  lang,
  creationType,
  name,
  description,
  prompt,
  photoPreview,
  onNameChange,
  onDescriptionChange,
  onPromptChange,
  onPhotoUpload,
}) => {
  const theme = useTheme();

  return (
    <Fade in timeout={500}>
      <Box>
        <Grid container spacing={3}>
          {/* Character Name */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={lang.characterName || "Character Name"}
              placeholder={
                lang.enterCharacterName ||
                "Enter a memorable name for your AI character"
              }
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label={lang.characterDescription || "Character Description"}
              placeholder={
                lang.describeCharacter ||
                "Describe your AI character's personality, expertise, and background..."
              }
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>

          {/* Upload Photo */}
          {creationType === "upload" && (
            <Grid item xs={12}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 4,
                  borderRadius: 3,
                  border: `2px dashed ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                {photoPreview ? (
                  <Box>
                    <Avatar
                      src={photoPreview}
                      sx={{
                        width: 200,
                        height: 200,
                        margin: "0 auto 24px",
                        boxShadow: `0 8px 24px ${alpha(
                          theme.palette.common.black,
                          0.15,
                        )}`,
                      }}
                    />
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadOutlined />}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      {lang.changePhoto || "Change Photo"}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={onPhotoUpload}
                      />
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <CloudUploadOutlined
                      sx={{
                        fontSize: 64,
                        color: theme.palette.primary.main,
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="h6"
                      gutterBottom
                      fontWeight={600}
                      color="text.primary"
                    >
                      {lang.uploadCharacterPhoto || "Upload Character Photo"}
                    </Typography>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<CloudUploadOutlined />}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        px: 4,
                      }}
                    >
                      {lang.chooseFile || "Choose File"}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={onPhotoUpload}
                      />
                    </Button>
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                      mt={2}
                    >
                      {lang.supportedFormats ||
                        "Supported: JPG, PNG, WebP (Max 5MB)"}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          )}

          {/* AI Prompt with Examples */}
          {creationType === "prompt" && (
            <Grid item xs={12}>
              <PromptExamples
                lang={lang}
                name={name}
                description={description}
                creationType={creationType}
                prompt={prompt}
                onPromptChange={onPromptChange}
              />
            </Grid>
          )}
        </Grid>
      </Box>
    </Fade>
  );
};

export default Step2;
