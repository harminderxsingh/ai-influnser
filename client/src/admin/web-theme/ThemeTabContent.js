// ./ThemeTabContent.js - Fixed Type Error
import React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Typography,
  Divider,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Button,
  IconButton,
} from "@mui/material";
import {
  ExpandMore,
  ContentCopy,
  Check,
  Visibility,
} from "@mui/icons-material";

const ThemeTabContent = ({
  tabValue,
  themeData,
  handleDirectChange,
  handleNestedChange,
  handleDeepNestedChange,
  copiedColor,
  copyToClipboard,
  lang,
}) => {
  // Color Input Component - FIXED
  const ColorInput = ({ label, value, onChange, colorKey, helperText }) => {
    // Convert value to string and provide default
    const stringValue = value != null ? String(value) : "#000000";
    const isRgba = stringValue.includes("rgba");

    return (
      <Box>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 2,
              bgcolor: stringValue,
              border: "2px solid",
              borderColor: "divider",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <input
              type="color"
              value={isRgba ? "#000000" : stringValue}
              onChange={(e) => onChange(colorKey, e.target.value)}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
              }}
            />
          </Box>
          <TextField
            size="small"
            value={stringValue}
            onChange={(e) => onChange(colorKey, e.target.value)}
            sx={{ flex: 1 }}
            helperText={helperText}
            InputProps={{
              endAdornment: (
                <IconButton
                  size="small"
                  onClick={() => copyToClipboard(stringValue)}
                >
                  {copiedColor === stringValue ? (
                    <Check fontSize="small" />
                  ) : (
                    <ContentCopy fontSize="small" />
                  )}
                </IconButton>
              ),
            }}
          />
        </Stack>
      </Box>
    );
  };

  // Color arrays based on new theme.json
  const brandColors = [
    { key: "primary_light", label: "Primary Light" },
    { key: "primary_dark", label: "Primary Dark" },
    { key: "secondary_light", label: "Secondary Light" },
    { key: "secondary_dark", label: "Secondary Dark" },
    { key: "accent_light", label: "Accent Light" },
    { key: "accent_dark", label: "Accent Dark" },
    { key: "success", label: "Success" },
    { key: "warning", label: "Warning" },
    { key: "error", label: "Error" },
    { key: "info", label: "Info" },
  ];

  const backgroundColors = [
    { key: "background_default_light", label: "Default Light" },
    { key: "background_paper_light", label: "Paper Light" },
    { key: "background_default_dark", label: "Default Dark" },
    { key: "background_paper_dark", label: "Paper Dark" },
  ];

  const textColors = [
    { key: "text_primary_light", label: "Primary Light" },
    { key: "text_secondary_light", label: "Secondary Light" },
    { key: "text_disabled_light", label: "Disabled Light" },
    { key: "text_primary_dark", label: "Primary Dark" },
    { key: "text_secondary_dark", label: "Secondary Dark" },
    { key: "text_disabled_dark", label: "Disabled Dark" },
  ];

  const uiColors = [
    { key: "divider_light", label: "Divider Light" },
    { key: "divider_dark", label: "Divider Dark" },
    { key: "border_light", label: "Border Light" },
    { key: "border_dark", label: "Border Dark" },
    {
      key: "action_hover_light",
      label: "Action Hover Light",
      helper: "rgba()",
    },
    { key: "action_hover_dark", label: "Action Hover Dark", helper: "rgba()" },
    {
      key: "action_selected_light",
      label: "Action Selected Light",
      helper: "rgba()",
    },
    {
      key: "action_selected_dark",
      label: "Action Selected Dark",
      helper: "rgba()",
    },
  ];

  const glassColors = [
    {
      key: "glass_bg_light",
      label: "Glass Background Light",
      helper: "rgba()",
    },
    { key: "glass_bg_dark", label: "Glass Background Dark", helper: "rgba()" },
  ];

  return (
    <Box>
      {/* Colors Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Brand Colors */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {lang.brandColors || "Brand Colors"}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {lang.brandColorsDesc ||
                    "Define your brand's primary color palette"}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  {brandColors.map(({ key, label }) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <ColorInput
                        label={label}
                        value={themeData[key] || "#000000"}
                        onChange={handleDirectChange}
                        colorKey={key}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Background Colors */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {lang.backgroundColors || "Background Colors"}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  {backgroundColors.map(({ key, label }) => (
                    <Grid item xs={12} sm={6} md={3} key={key}>
                      <ColorInput
                        label={label}
                        value={themeData[key] || "#FFFFFF"}
                        onChange={handleDirectChange}
                        colorKey={key}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Text Colors */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {lang.textColors || "Text Colors"}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  {textColors.map(({ key, label }) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <ColorInput
                        label={label}
                        value={themeData[key] || "#000000"}
                        onChange={handleDirectChange}
                        colorKey={key}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* UI Colors */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {lang.uiElementColors || "UI Element Colors"}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  {uiColors.map(({ key, label, helper }) => (
                    <Grid item xs={12} sm={6} md={3} key={key}>
                      <ColorInput
                        label={label}
                        value={themeData[key] || "rgba(0, 0, 0, 0.04)"}
                        onChange={handleDirectChange}
                        colorKey={key}
                        helperText={helper}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Glass Colors */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {lang.glassColors || "Glass Effect Colors"}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {lang.glassColorsDesc ||
                    "Semi-transparent backgrounds with blur effect"}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  {glassColors.map(({ key, label, helper }) => (
                    <Grid item xs={12} sm={6} key={key}>
                      <ColorInput
                        label={label}
                        value={themeData[key] || "rgba(255, 255, 255, 0.7)"}
                        onChange={handleDirectChange}
                        colorKey={key}
                        helperText={helper}
                      />
                    </Grid>
                  ))}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={lang.glassBlur || "Glass Blur Amount"}
                      value={themeData.glass_blur || "12px"}
                      onChange={(e) =>
                        handleDirectChange("glass_blur", e.target.value)
                      }
                      helperText="e.g., 12px, 20px"
                    />
                  </Grid>
                </Grid>

                {/* Glass Preview */}
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    {lang.preview || "Preview"}:
                  </Typography>
                  <Box
                    sx={{
                      p: 4,
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      borderRadius: 3,
                      position: "relative",
                      minHeight: 200,
                    }}
                  >
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        background:
                          themeData.glass_bg_light ||
                          "rgba(255, 255, 255, 0.7)",
                        backdropFilter: `blur(${themeData.glass_blur || "12px"})`,
                        maxWidth: 400,
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        Glass Effect Preview
                      </Typography>
                      <Typography variant="body2">
                        This demonstrates the glass effect with your current
                        settings.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Gradients */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {lang.gradients || "Gradients"}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={
                        lang.gradientPrimaryLight || "Gradient Primary Light"
                      }
                      value={themeData.gradient_primary_light || ""}
                      onChange={(e) =>
                        handleDirectChange(
                          "gradient_primary_light",
                          e.target.value,
                        )
                      }
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={
                        lang.gradientPrimaryDark || "Gradient Primary Dark"
                      }
                      value={themeData.gradient_primary_dark || ""}
                      onChange={(e) =>
                        handleDirectChange(
                          "gradient_primary_dark",
                          e.target.value,
                        )
                      }
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={lang.gradientSecondary || "Gradient Secondary"}
                      value={themeData.gradient_secondary || ""}
                      onChange={(e) =>
                        handleDirectChange("gradient_secondary", e.target.value)
                      }
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={lang.gradientSuccess || "Gradient Success"}
                      value={themeData.gradient_success || ""}
                      onChange={(e) =>
                        handleDirectChange("gradient_success", e.target.value)
                      }
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Typography Tab */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {lang.typographySettings || "Typography Settings"}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={lang.fontFamily || "Font Family"}
                  value={themeData.font_family || ""}
                  onChange={(e) =>
                    handleDirectChange("font_family", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label={lang.baseFontSize || "Base Font Size (px)"}
                  value={themeData.font_size_base || 14}
                  onChange={(e) =>
                    handleDirectChange(
                      "font_size_base",
                      parseInt(e.target.value),
                    )
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label={lang.fontWeightLight || "Font Weight Light"}
                  value={themeData.font_weight_light || 300}
                  onChange={(e) =>
                    handleDirectChange(
                      "font_weight_light",
                      parseInt(e.target.value),
                    )
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label={lang.fontWeightRegular || "Font Weight Regular"}
                  value={themeData.font_weight_regular || 400}
                  onChange={(e) =>
                    handleDirectChange(
                      "font_weight_regular",
                      parseInt(e.target.value),
                    )
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label={lang.fontWeightMedium || "Font Weight Medium"}
                  value={themeData.font_weight_medium || 500}
                  onChange={(e) =>
                    handleDirectChange(
                      "font_weight_medium",
                      parseInt(e.target.value),
                    )
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label={lang.fontWeightSemibold || "Font Weight Semibold"}
                  value={themeData.font_weight_semibold || 600}
                  onChange={(e) =>
                    handleDirectChange(
                      "font_weight_semibold",
                      parseInt(e.target.value),
                    )
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label={lang.fontWeightBold || "Font Weight Bold"}
                  value={themeData.font_weight_bold || 700}
                  onChange={(e) =>
                    handleDirectChange(
                      "font_weight_bold",
                      parseInt(e.target.value),
                    )
                  }
                />
              </Grid>
            </Grid>

            {/* Typography Preview */}
            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                {lang.preview || "Preview"}
              </Typography>
              <Stack spacing={2}>
                <Typography variant="h1">
                  {lang.heading1 || "Heading 1"}
                </Typography>
                <Typography variant="h2">
                  {lang.heading2 || "Heading 2"}
                </Typography>
                <Typography variant="h3">
                  {lang.heading3 || "Heading 3"}
                </Typography>
                <Typography variant="h4">
                  {lang.heading4 || "Heading 4"}
                </Typography>
                <Typography variant="h5">
                  {lang.heading5 || "Heading 5"}
                </Typography>
                <Typography variant="h6">
                  {lang.heading6 || "Heading 6"}
                </Typography>
                <Typography variant="body1">
                  {lang.body1Sample ||
                    "Body 1: Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
                </Typography>
                <Typography variant="body2">
                  {lang.body2Sample ||
                    "Body 2: Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
                </Typography>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Button Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          {themeData.button &&
            Object.entries(themeData.button).map(([variant, styles]) => (
              <Grid item xs={12} key={variant}>
                <Accordion defaultExpanded={variant === "contained"}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" fontWeight={600}>
                      {variant.charAt(0).toUpperCase() + variant.slice(1)}{" "}
                      {lang.button || "Button"}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {typeof styles === "object" &&
                        Object.entries(styles).map(([key, value]) => (
                          <Grid item xs={12} sm={6} md={4} key={key}>
                            {key.includes("Color") ||
                            key.includes("Bg") ||
                            key.includes("backgroundColor") ? (
                              <ColorInput
                                label={key.replace(/([A-Z_])/g, " $1").trim()}
                                value={value}
                                onChange={(colorKey, newValue) =>
                                  handleDeepNestedChange(
                                    "button",
                                    variant,
                                    key,
                                    newValue,
                                  )
                                }
                                colorKey={key}
                              />
                            ) : (
                              <TextField
                                fullWidth
                                label={key.replace(/([A-Z])/g, " $1").trim()}
                                value={value}
                                onChange={(e) =>
                                  handleDeepNestedChange(
                                    "button",
                                    variant,
                                    key,
                                    e.target.value,
                                  )
                                }
                                size="small"
                              />
                            )}
                          </Grid>
                        ))}
                    </Grid>

                    {/* Button Preview */}
                    <Box mt={3}>
                      <Typography variant="subtitle2" gutterBottom>
                        {lang.preview || "Preview"}:
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Button variant={variant === "text" ? "text" : variant}>
                          {variant} {lang.button || "Button"}
                        </Button>
                        <Button
                          variant={variant === "text" ? "text" : variant}
                          size="small"
                        >
                          {lang.small || "Small"}
                        </Button>
                        <Button
                          variant={variant === "text" ? "text" : variant}
                          size="large"
                        >
                          {lang.large || "Large"}
                        </Button>
                      </Stack>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            ))}
        </Grid>
      )}

      {/* Card Tab */}
      {tabValue === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {lang.cardSettings || "Card Settings"}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {themeData.card &&
                Object.entries(themeData.card).map(([key, value]) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    {key.includes("Color") ||
                    key.includes("Bg") ||
                    key.includes("backgroundColor") ? (
                      <ColorInput
                        label={key.replace(/([A-Z_])/g, " $1").trim()}
                        value={value}
                        onChange={(colorKey, newValue) =>
                          handleNestedChange("card", key, newValue)
                        }
                        colorKey={key}
                      />
                    ) : (
                      <TextField
                        fullWidth
                        label={key.replace(/([A-Z_])/g, " $1").trim()}
                        value={value}
                        onChange={(e) =>
                          handleNestedChange("card", key, e.target.value)
                        }
                        size="small"
                      />
                    )}
                  </Grid>
                ))}
            </Grid>

            {/* Card Preview */}
            <Box mt={4}>
              <Typography variant="subtitle2" gutterBottom>
                {lang.preview || "Preview"}:
              </Typography>
              <Card sx={{ maxWidth: 400 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {lang.sampleCard || "Sample Card"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {lang.cardPreviewText ||
                      "This is how your cards will look with the current settings."}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Input Tab */}
      {tabValue === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {lang.inputSettings || "Input/TextField Settings"}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {themeData.textField &&
                Object.entries(themeData.textField).map(([key, value]) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    {key.includes("Color") ||
                    key.includes("Bg") ||
                    key.includes("backgroundColor") ? (
                      <ColorInput
                        label={key.replace(/([A-Z_])/g, " $1").trim()}
                        value={value}
                        onChange={(colorKey, newValue) =>
                          handleNestedChange("textField", key, newValue)
                        }
                        colorKey={key}
                      />
                    ) : (
                      <TextField
                        fullWidth
                        label={key.replace(/([A-Z_])/g, " $1").trim()}
                        value={value}
                        onChange={(e) =>
                          handleNestedChange("textField", key, e.target.value)
                        }
                        size="small"
                      />
                    )}
                  </Grid>
                ))}
            </Grid>

            {/* Input Preview */}
            <Box mt={4}>
              <Typography variant="subtitle2" gutterBottom>
                {lang.preview || "Preview"}:
              </Typography>
              <Stack spacing={2} maxWidth={400}>
                <TextField
                  label={lang.standardInput || "Standard Input"}
                  variant="outlined"
                />
                <TextField
                  label={lang.filledInput || "Filled Input"}
                  variant="filled"
                />
                <TextField
                  label={lang.errorState || "Error State"}
                  variant="outlined"
                  error
                  helperText={lang.errorMessage || "Error message"}
                />
                <TextField
                  label={lang.disabled || "Disabled"}
                  variant="outlined"
                  disabled
                />
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Components Tab */}
      {tabValue === 5 && (
        <Grid container spacing={3}>
          {/* Render all component sections */}
          {[
            "box",
            "paper",
            "drawer",
            "appBar",
            "dialog",
            "menu",
            "tooltip",
            "alert",
            "snackbar",
            "table",
            "tabs",
            "accordion",
            "chip",
            "switch",
            "checkbox",
            "radio",
            "slider",
            "avatar",
            "badge",
            "breadcrumbs",
            "stepper",
            "pagination",
            "divider",
            "list",
          ].map((componentKey) => {
            if (!themeData[componentKey]) return null;

            return (
              <Grid item xs={12} key={componentKey}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" fontWeight={600}>
                      {componentKey.charAt(0).toUpperCase() +
                        componentKey.slice(1)}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {Object.entries(themeData[componentKey]).map(
                        ([key, value]) => (
                          <Grid item xs={12} sm={6} md={4} key={key}>
                            {key.includes("Color") ||
                            key.includes("Bg") ||
                            key.includes("backgroundColor") ? (
                              <ColorInput
                                label={key.replace(/([A-Z_])/g, " $1").trim()}
                                value={value}
                                onChange={(colorKey, newValue) =>
                                  handleNestedChange(
                                    componentKey,
                                    key,
                                    newValue,
                                  )
                                }
                                colorKey={key}
                              />
                            ) : typeof value === "boolean" ? (
                              <TextField
                                fullWidth
                                select
                                label={key.replace(/([A-Z_])/g, " $1").trim()}
                                value={value.toString()}
                                onChange={(e) =>
                                  handleNestedChange(
                                    componentKey,
                                    key,
                                    e.target.value === "true",
                                  )
                                }
                                size="small"
                                SelectProps={{ native: true }}
                              >
                                <option value="true">True</option>
                                <option value="false">False</option>
                              </TextField>
                            ) : (
                              <TextField
                                fullWidth
                                label={key.replace(/([A-Z_])/g, " $1").trim()}
                                value={value != null ? value : ""}
                                onChange={(e) =>
                                  handleNestedChange(
                                    componentKey,
                                    key,
                                    e.target.value,
                                  )
                                }
                                size="small"
                              />
                            )}
                          </Grid>
                        ),
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Advanced Tab */}
      {tabValue === 6 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="info">
              {lang.advancedWarning ||
                "Advanced settings allow you to edit the raw JSON. Be careful when making changes here."}
            </Alert>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {lang.rawJsonEditor || "Raw JSON Editor"}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <TextField
                  fullWidth
                  multiline
                  rows={25}
                  value={JSON.stringify(themeData, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      handleDirectChange("__full__", parsed);
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Global Settings */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {lang.globalSettings || "Global Settings"}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label={lang.spacingUnit || "Spacing Unit (px)"}
                      value={themeData.spacing_unit || 6}
                      onChange={(e) =>
                        handleDirectChange(
                          "spacing_unit",
                          parseInt(e.target.value),
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label={lang.transitionDuration || "Transition Duration"}
                      value={themeData.transition_duration || "0.2s"}
                      onChange={(e) =>
                        handleDirectChange(
                          "transition_duration",
                          e.target.value,
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label={lang.transitionEasing || "Transition Easing"}
                      value={
                        themeData.transition_easing ||
                        "cubic-bezier(0.4, 0, 0.2, 1)"
                      }
                      onChange={(e) =>
                        handleDirectChange("transition_easing", e.target.value)
                      }
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ThemeTabContent;
