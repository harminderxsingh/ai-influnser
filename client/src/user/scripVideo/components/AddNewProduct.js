// addNewProduct/AddNewProduct.js
import {
  AddOutlined,
  PersonOutlined,
  ImageOutlined,
  TextFieldsOutlined,
  AspectRatioOutlined,
  CheckCircleOutlined,
  ArrowForwardOutlined,
  ArrowBackOutlined,
  CloudUploadOutlined,
  CloseOutlined,
  Face2,
  AutoAwesomeOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Grid,
  Typography,
  alpha,
  useTheme,
  Avatar,
  Stack,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Card,
  CardMedia,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import React from "react";
import CommonDialog from "../../../common/CommonDialog";
import ModelCard from "./ModelCard";
import PageHeader from "../../../common/PageHeader";

const AddNewProduct = ({ lang = {}, inf = [], hitAxios, fetchContents }) => {
  const createSubmissionKey = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  };

  const submitLockRef = React.useRef(false);
  const [state, setState] = React.useState({
    dialog: false,
    step: 0,
    selectedModel: null,
    productImage: null,
    productImagePreview: null,
    prompt: "",
    aspectRatio: "9:16",
    isSubmitting: false,
    submissionKey: "",
    promptRecommendations: [],
    promptRecommendationLoading: false,
    promptRecommendationError: "",
    promptRecommendationCredits: null,
  });

  const theme = useTheme();

  const steps = [
    lang.selectModel || "Select Model",
    lang.uploadProduct || "Upload Product",
    lang.addPrompt || "Add Prompt",
  ];

  const aspectRatios = [
    { value: "16:9", label: "16:9 (Landscape)", icon: "📺" },
    { value: "9:16", label: "9:16 (Portrait)", icon: "📱" },
    { value: "auto", label: "Auto (AI Decides)", icon: "🤖" },
  ];

  const handleSelectModel = (model) => {
    setState({
      ...state,
      selectedModel: state.selectedModel?.id === model.id ? null : model,
    });
  };

  const handleProductImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setState({
        ...state,
        productImage: file,
        productImagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleRemoveProductImage = () => {
    setState({
      ...state,
      productImage: null,
      productImagePreview: null,
    });
  };

  const handleNext = () => {
    if (
      (state.step === 0 && state.selectedModel) ||
      (state.step === 1 && state.productImage)
    ) {
      setState({ ...state, step: state.step + 1 });
    }
  };

  const handleBack = () => {
    setState({ ...state, step: state.step - 1 });
  };

  async function handleConfirm() {
    if (submitLockRef.current || state.isSubmitting) return;

    submitLockRef.current = true;
    setState((prev) => ({ ...prev, isSubmitting: true }));

    const formData = new FormData();
    formData.append("model_id", state.selectedModel.id);
    formData.append("model_name", state.selectedModel.name);
    formData.append("product_image", state.productImage);
    formData.append("prompt", state.prompt);
    formData.append("aspect_ratio", state.aspectRatio);
    formData.append("submission_key", state.submissionKey);

    try {
      const res = await hitAxios({
        path: "/api/content/add_new_product_content",
        post: true,
        admin: false,
        obj: formData,
        isFormData: true,
      });

      if (res.data.success) {
        await fetchContents();
        handleClose();
        return;
      }
    } finally {
      submitLockRef.current = false;
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }

  async function handleGeneratePromptRecommendations() {
    if (state.promptRecommendationLoading) return;

    setState((prev) => ({
      ...prev,
      promptRecommendationLoading: true,
      promptRecommendationError: "",
    }));

    try {
      const res = await hitAxios({
        path: "/api/prompt-recommendation/generate",
        post: true,
        admin: false,
        obj: {
          type: "product_showcase",
          source_id: state.selectedModel?.id,
          context: {
            modelName: state.selectedModel?.name,
            productImageName: state.productImage?.name,
            promptSeed: state.prompt,
            aspectRatio: state.aspectRatio,
          },
        },
        showLoading: false,
      });

      if (res?.data?.success) {
        setState((prev) => ({
          ...prev,
          promptRecommendations: res.data.prompts || [],
          promptRecommendationCredits: res.data.credits,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          promptRecommendationError:
            res?.data?.msg || "Could not generate prompt ideas",
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        promptRecommendationError: "Could not generate prompt ideas",
      }));
    } finally {
      setState((prev) => ({ ...prev, promptRecommendationLoading: false }));
    }
  }

  const handleClose = () => {
    submitLockRef.current = false;
    setState({
      dialog: false,
      step: 0,
      selectedModel: null,
      productImage: null,
      productImagePreview: null,
      prompt: "",
      aspectRatio: "9:16",
      isSubmitting: false,
      submissionKey: "",
      promptRecommendations: [],
      promptRecommendationLoading: false,
      promptRecommendationError: "",
      promptRecommendationCredits: null,
    });
  };

  return (
    <div>
      <Button
        size="large"
        onClick={() =>
          setState({
            ...state,
            dialog: true,
            submissionKey: createSubmissionKey(),
          })
        }
        startIcon={<AddOutlined />}
        variant="contained"
      >
        {lang.createShowcase || "Create Showcase"}
      </Button>

      <CommonDialog
        title={
          state.step === 0
            ? lang.selectModel || "Select Model"
            : state.step === 1
              ? lang.uploadProduct || "Upload Product"
              : lang.addPrompt || "Add Prompt & Settings"
        }
        open={state.dialog}
        onClose={handleClose}
        icon={
          state.step === 0
            ? PersonOutlined
            : state.step === 1
              ? ImageOutlined
              : TextFieldsOutlined
        }
        maxWidth="md"
      >
        <Box sx={{ mt: 2 }}>
          {/* Stepper */}
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={state.step}>
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    sx={{
                      "& .MuiStepLabel-label": {
                        fontWeight: state.step === index ? 700 : 500,
                        fontSize: "0.9rem",
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Step 0: Select Model */}
          {state.step === 0 && (
            <>
              {/* Info Banner */}
              <PageHeader
                icon={Face2}
                title={lang.chooseYourModel || "Choose Your Model"}
                subtitle={
                  lang.selectModelDescription ||
                  "Select the influencer to showcase your product"
                }
              />

              {/* Model Grid */}
              <Grid container spacing={2.5}>
                {inf.map((model) => (
                  <Grid item xs={6} sm={4} md={3} key={model.id}>
                    <ModelCard
                      model={model}
                      isSelected={state.selectedModel?.id === model.id}
                      onSelect={() => handleSelectModel(model)}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Selected Info */}
              {state.selectedModel && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    border: `2px solid ${alpha(
                      theme.palette.success.main,
                      0.3,
                    )}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    animation: "slideIn 0.3s ease",
                    "@keyframes slideIn": {
                      "0%": {
                        transform: "translateY(10px)",
                        opacity: 0,
                      },
                      "100%": {
                        transform: "translateY(0)",
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <CheckCircleOutlined
                    sx={{
                      color: theme.palette.success.main,
                      fontSize: 28,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.success.main,
                      }}
                    >
                      {lang.selected || "Selected"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {state.selectedModel.name}
                    </Typography>
                  </Box>
                </Box>
              )}
            </>
          )}

          {/* Step 1: Upload Product Image */}
          {state.step === 1 && (
            <>
              <PageHeader
                icon={Face2}
                title={lang.uploadProductImage || "Upload Product Image"}
                subtitle={
                  lang.uploadProductDescription ||
                  "Upload a clear image of your product"
                }
              />

              {/* Upload Area */}
              {!state.productImagePreview ? (
                <Box
                  sx={{
                    border: `2px dashed ${theme.palette.divider}`,
                    borderRadius: 3,
                    p: 6,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                  onClick={() =>
                    document.getElementById("product-image-upload").click()
                  }
                >
                  <input
                    id="product-image-upload"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleProductImageUpload}
                  />
                  <CloudUploadOutlined
                    sx={{
                      fontSize: 64,
                      color: theme.palette.text.secondary,
                      mb: 2,
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {lang.clickToUpload || "Click to Upload"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {lang.supportedFormats || "PNG, JPG, JPEG (Max 10MB)"}
                  </Typography>
                </Box>
              ) : (
                <Card
                  sx={{
                    position: "relative",
                    borderRadius: 3,
                    overflow: "hidden",
                    boxShadow: `0 8px 24px ${alpha("#000000", 0.15)}`,
                  }}
                >
                  <CardMedia
                    component="img"
                    image={state.productImagePreview}
                    alt="Product"
                    sx={{
                      width: "100%",
                      height: "auto",
                      maxHeight: 400,
                      objectFit: "contain",
                      bgcolor: alpha("#000000", 0.05),
                    }}
                  />
                  <IconButton
                    onClick={handleRemoveProductImage}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      bgcolor: alpha("#000000", 0.6),
                      color: "#FFFFFF",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.error.main, 0.9),
                      },
                    }}
                  >
                    <CloseOutlined />
                  </IconButton>
                </Card>
              )}

              {/* Selected Info */}
              {state.productImagePreview && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    border: `2px solid ${alpha(
                      theme.palette.primary.main,
                      0.3,
                    )}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <CheckCircleOutlined
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: 28,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                      }}
                    >
                      {lang.imageUploaded || "Image Uploaded"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {state.productImage?.name}
                    </Typography>
                  </Box>
                </Box>
              )}
            </>
          )}

          {/* Step 2: Add Prompt & Settings */}
          {state.step === 2 && (
            <>
              {/* Info Banner */}
              <Box
                sx={{
                  mb: 3,
                  p: 2.5,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.info.main,
                    0.1,
                  )} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                  border: `2px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: `linear-gradient(90deg, ${theme.palette.info.main}, ${theme.palette.secondary.main})`,
                  },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.info.main, 0.2),
                      color: theme.palette.info.main,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <TextFieldsOutlined />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        mb: 0.5,
                      }}
                    >
                      {lang.addPromptAndSettings || "Add Prompt & Settings"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.5,
                        fontSize: "0.85rem",
                      }}
                    >
                      {lang.promptDescription ||
                        "Describe what the model should say or do (8 seconds video)"}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Prompt Input */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1.5, fontWeight: 700 }}
                >
                  {lang.prompt || "Prompt"}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder={
                    lang.promptPlaceholder ||
                    'e.g., "This product is amazing! It changed my life. You should definitely try it!"'
                  }
                  value={state.prompt}
                  onChange={(e) =>
                    setState({ ...state, prompt: e.target.value })
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>

              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.secondary.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {lang.recommendedPrompts || "Recommended Prompt Ideas"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lang.recommendedPromptsDesc ||
                        "Generate ready-to-use prompt ideas for this product showcase."}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={
                      state.promptRecommendationLoading ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <AutoAwesomeOutlined />
                      )
                    }
                    disabled={state.promptRecommendationLoading}
                    onClick={handleGeneratePromptRecommendations}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                  >
                    {state.promptRecommendationLoading
                      ? lang.generating || "Generating..."
                      : lang.generateIdeas || "Generate Ideas"}
                  </Button>
                </Stack>

                {state.promptRecommendationError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {state.promptRecommendationError}
                  </Alert>
                )}

                {state.promptRecommendations.length > 0 && (
                  <Stack spacing={1.25} sx={{ mt: 2 }}>
                    {state.promptRecommendationCredits !== null && (
                      <Typography variant="caption" color="text.secondary">
                        {lang.creditsUsed || "Credits used"}:{" "}
                        {state.promptRecommendationCredits}
                      </Typography>
                    )}
                    {state.promptRecommendations.map((item, index) => (
                      <Box
                        key={`${item.title}-${index}`}
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            prompt: item.prompt,
                          }))
                        }
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          cursor: "pointer",
                          bgcolor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          "&:hover": {
                            borderColor: theme.palette.secondary.main,
                            bgcolor: alpha(theme.palette.secondary.main, 0.04),
                          },
                        }}
                      >
                        <Typography variant="caption" fontWeight={800}>
                          {item.title || `${lang.idea || "Idea"} ${index + 1}`}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {item.prompt}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>

              {/* Aspect Ratio Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1.5,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <AspectRatioOutlined fontSize="small" />
                  {lang.aspectRatio || "Aspect Ratio"}
                </Typography>
                <ToggleButtonGroup
                  value={state.aspectRatio}
                  exclusive
                  onChange={(e, value) => {
                    if (value) setState({ ...state, aspectRatio: value });
                  }}
                  fullWidth
                  sx={{
                    "& .MuiToggleButton-root": {
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      "&.Mui-selected": {
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                        color: theme.palette.primary.main,
                        borderColor: theme.palette.primary.main,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.25),
                        },
                      },
                    },
                  }}
                >
                  {aspectRatios.map((ratio) => (
                    <ToggleButton key={ratio.value} value={ratio.value}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" sx={{ mb: 0.5 }}>
                          {ratio.icon}
                        </Typography>
                        <Typography variant="body2">{ratio.label}</Typography>
                      </Box>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              {/* Video Duration Info */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  ⏱️{" "}
                  <strong>
                    {lang.videoDuration || "Video Duration: 8 seconds (fixed)"}
                  </strong>
                </Typography>
              </Box>

              {/* Summary */}
              <Box
                sx={{
                  mt: 3,
                  p: 2.5,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.1,
                  )} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
                  border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  {lang.summary || "Summary"}
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PersonOutlined fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>{lang.model || "Model"}:</strong>{" "}
                      {state.selectedModel?.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ImageOutlined fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>{lang.product || "Product"}:</strong>{" "}
                      {state.productImage?.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AspectRatioOutlined fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>{lang.aspectRatio || "Aspect Ratio"}:</strong>{" "}
                      {state.aspectRatio}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextFieldsOutlined fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>{lang.prompt || "Prompt"}:</strong>{" "}
                      {state.prompt || lang.notProvided || "Not provided"}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </>
          )}

          {/* Action Buttons */}
          <Box
            sx={{
              mt: 4,
              display: "flex",
              gap: 2,
              justifyContent: "space-between",
            }}
          >
            <Button
              onClick={handleClose}
              variant="outlined"
              disabled={state.isSubmitting}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: 2,
              }}
            >
              {lang.cancel || "Cancel"}
            </Button>

            <Box sx={{ display: "flex", gap: 2 }}>
              {state.step > 0 && (
                <Button
                  onClick={handleBack}
                  variant="outlined"
                  disabled={state.isSubmitting}
                  startIcon={<ArrowBackOutlined />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                  }}
                >
                  {lang.back || "Back"}
                </Button>
              )}

              {state.step < 2 ? (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  disabled={
                    state.isSubmitting ||
                    (state.step === 0 && !state.selectedModel) ||
                    (state.step === 1 && !state.productImage)
                  }
                  endIcon={<ArrowForwardOutlined />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    minWidth: 140,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    boxShadow:
                      (state.step === 0 && state.selectedModel) ||
                      (state.step === 1 && state.productImage)
                        ? `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
                        : "none",
                  }}
                >
                  {lang.next || "Next"}
                </Button>
              ) : (
                <Button
                  onClick={handleConfirm}
                  variant="contained"
                  color="success"
                  disabled={state.isSubmitting}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    minWidth: 140,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: `0 4px 14px ${alpha(
                      theme.palette.success.main,
                      0.4,
                    )}`,
                  }}
                >
                  {state.isSubmitting
                    ? lang.generating || "Generating..."
                    : lang.generateVideo || "Generate Video"}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </CommonDialog>
    </div>
  );
};

export default AddNewProduct;
