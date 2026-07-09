import React from "react";
import PageHeader from "../../common/PageHeader";
import {
  Face2,
  AddOutlined,
  ArrowForwardOutlined,
  ArrowBackOutlined,
  CheckCircleOutlined,
  AutoAwesomeOutlined,
} from "@mui/icons-material";
import {
  Button,
  Grid,
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import CommonDialog from "../../common/CommonDialog";
import Step1 from "./components/Step1";
import Step2 from "./components/Step2";
import Step3 from "./components/Step3";
import { GlobalContext } from "../../context/GlobalContext";
import InfluencerCard from "./components/InfluencerCard";
import { UserContext } from "../../context/UserContext";

const Influencers = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const { getUserData } = React.useContext(UserContext);
  const [state, setState] = React.useState({
    dialog: false,
    activeStep: 0,
    creationType: "upload",
    photoPreview: null,
    photoFile: null,
    loading: false,
    snackbar: { open: false, message: "", severity: "success" },
    name: "",
    description: "",
    prompt: "",
  });

  const [influencers, setInfluencers] = React.useState([]);

  const steps = [
    lang.creationMethod || "Creation Method",
    lang.characterDetails || "Character Details",
    lang.reviewAndCreate || "Review & Create",
  ];

  const fetchInfluencers = React.useCallback(async ({ closeDialog = false } = {}) => {
    try {
      const res = await hitAxios({
        path: "/api/inf/get_models",
        post: false,
        admin: false,
        showLoading: false,
      });

      if (res?.data?.success) {
        setInfluencers(res.data.data || []);
        if (closeDialog) {
          setState((prev) => ({
            ...prev,
            dialog: false,
            activeStep: 0,
            creationType: "upload",
            photoPreview: null,
            photoFile: null,
            name: "",
            description: "",
            prompt: "",
          }));
        }
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        snackbar: {
          open: true,
          message: lang.errorLoadingInfluencers || "Error loading influencers",
          severity: "error",
        },
      }));
    }
  }, [hitAxios, lang.errorLoadingInfluencers]);

  React.useEffect(() => {
    fetchInfluencers();
  }, [fetchInfluencers]);

  React.useEffect(() => {
    const hasProcessingInfluencer = influencers.some(
      (influencer) => influencer.status === "processing",
    );

    if (!hasProcessingInfluencer) return undefined;

    const intervalId = setInterval(fetchInfluencers, 10000);
    return () => clearInterval(intervalId);
  }, [fetchInfluencers, influencers]);

  const showSnackbar = (message, severity = "success") => {
    setState((prev) => ({
      ...prev,
      snackbar: { open: true, message, severity },
    }));
  };

  const handleCloseSnackbar = () => {
    setState((prev) => ({
      ...prev,
      snackbar: { ...prev.snackbar, open: false },
    }));
  };

  const handleOpenDialog = () => {
    setState((prev) => ({
      ...prev,
      dialog: true,
      activeStep: 0,
      creationType: "upload",
      photoPreview: null,
      photoFile: null,
      name: "",
      description: "",
      prompt: "",
    }));
  };

  const handleCloseDialog = () => {
    setState((prev) => ({
      ...prev,
      dialog: false,
      activeStep: 0,
      creationType: "upload",
      photoPreview: null,
      photoFile: null,
      name: "",
      description: "",
      prompt: "",
    }));
  };

  const handleNext = () => {
    if (state.activeStep === 1) {
      if (!state.name.trim()) {
        showSnackbar(
          lang.pleaseEnterCharacterName || "Please enter a character name",
          "error",
        );
        return;
      }
      if (!state.description.trim()) {
        showSnackbar(
          lang.pleaseEnterDescription || "Please enter a description",
          "error",
        );
        return;
      }
      if (state.creationType === "upload" && !state.photoFile) {
        showSnackbar(
          lang.pleaseUploadPhoto || "Please upload a photo",
          "error",
        );
        return;
      }
      if (state.creationType === "prompt" && !state.prompt.trim()) {
        showSnackbar(
          lang.pleaseEnterPrompt || "Please enter a prompt",
          "error",
        );
        return;
      }
    }

    setState((prev) => ({ ...prev, activeStep: prev.activeStep + 1 }));
  };

  const handleBack = () => {
    setState((prev) => ({ ...prev, activeStep: prev.activeStep - 1 }));
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        showSnackbar(
          lang.invalidFileType ||
            "Invalid file type. Only JPG, PNG, and WebP are allowed",
          "error",
        );
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showSnackbar(
          lang.fileSizeTooLarge || "File size too large. Maximum 5MB allowed",
          "error",
        );
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setState((prev) => ({
          ...prev,
          photoPreview: reader.result,
          photoFile: file,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const formData = new FormData();
      formData.append("name", state.name);
      formData.append("description", state.description);
      formData.append("creation_type", state.creationType);

      if (state.creationType === "prompt") {
        formData.append("prompt", state.prompt);
      }

      if (state.photoFile) {
        formData.append("photo", state.photoFile);
      }

      const res = await hitAxios({
        path: "/api/inf/add_model",
        post: true,
        admin: false,
        obj: formData,
      });

      if (res?.data?.success) {
        showSnackbar(res.data.msg, "success");
        fetchInfluencers({ closeDialog: true });
        setTimeout(() => {
          getUserData();
        }, 3000);
      } else {
        showSnackbar(res?.data?.msg || "Something went wrong", "error");
      }
    } catch (err) {
      showSnackbar("Error submitting form", "error");
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(lang.areYouSure || "Are you sure?")) {
      const res = await hitAxios({
        path: "/api/inf/delete_model",
        post: true,
        admin: false,
        obj: { id },
      });

      if (res?.data?.success) {
        showSnackbar(res.data.msg, "success");
        fetchInfluencers();
      } else {
        showSnackbar(
          res?.data?.msg ||
            lang.errorDeletingCharacter ||
            "Error deleting character",
          "error",
        );
      }
    }
  };

  return (
    <div>
      <PageHeader
        icon={Face2}
        primaryAction={
          <Button
            variant="contained"
            size="large"
            startIcon={<AddOutlined />}
            onClick={handleOpenDialog}
          >
            {lang.addNewCharacter || "Create AI Character"}
          </Button>
        }
        title={lang.influencers || "AI Characters"}
        subtitle={
          lang.manageInfluencers ||
          "Create and manage AI-powered virtual influencers"
        }
      />

      {/* Gallery Grid */}
      <Grid container spacing={2} mt={0.5}>
        {influencers.map((influencer) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={influencer.id}>
            <InfluencerCard
              lang={lang}
              influencer={{
                ...influencer,
                photo_url: influencer.photo_url
                  ? `/media/${influencer.photo_url}`
                  : null,
              }}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>

      {/* Wizard Dialog */}
      <CommonDialog
        open={state.dialog}
        onClose={handleCloseDialog}
        title={`${lang.createAICharacter || "Create AI Character"} - ${lang.step || "Step"} ${state.activeStep + 1} ${lang.of || "of"} 3`}
        subtitle={steps[state.activeStep]}
        icon={AddOutlined}
        fullScreen
      >
        <Box sx={{ maxWidth: 900, mx: "auto", py: 4, px: 3 }}>
          <Stepper
            activeStep={state.activeStep}
            sx={{ mb: 5 }}
            alternativeLabel
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 400, mb: 4 }}>
            {state.activeStep === 0 && (
              <Step1
                lang={lang}
                creationType={state.creationType}
                onCreationTypeChange={(type) =>
                  setState((prev) => ({ ...prev, creationType: type }))
                }
              />
            )}
            {state.activeStep === 1 && (
              <Step2
                lang={lang}
                creationType={state.creationType}
                name={state.name}
                description={state.description}
                prompt={state.prompt}
                photoPreview={state.photoPreview}
                onNameChange={(value) =>
                  setState((prev) => ({ ...prev, name: value }))
                }
                onDescriptionChange={(value) =>
                  setState((prev) => ({ ...prev, description: value }))
                }
                onPromptChange={(value) =>
                  setState((prev) => ({ ...prev, prompt: value }))
                }
                onPhotoUpload={handlePhotoUpload}
              />
            )}
            {state.activeStep === 2 && (
              <Step3
                lang={lang}
                creationType={state.creationType}
                name={state.name}
                description={state.description}
                prompt={state.prompt}
                photoPreview={state.photoPreview}
              />
            )}
          </Box>

          {/* Navigation */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              pt: 3,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Button
              disabled={state.activeStep === 0 || state.loading}
              onClick={handleBack}
              startIcon={<ArrowBackOutlined />}
            >
              {lang.back || "Back"}
            </Button>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCloseDialog}
                disabled={state.loading}
              >
                {lang.cancel || "Cancel"}
              </Button>

              {state.activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={state.loading}
                  startIcon={
                    state.loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : state.creationType === "prompt" ? (
                      <AutoAwesomeOutlined />
                    ) : (
                      <CheckCircleOutlined />
                    )
                  }
                >
                  {state.loading
                    ? lang.processing || "Processing..."
                    : state.creationType === "prompt"
                      ? lang.generateCharacter || "Generate Character"
                      : lang.createCharacter || "Create Character"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={state.loading}
                  endIcon={<ArrowForwardOutlined />}
                >
                  {lang.next || "Next"}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </CommonDialog>

      {/* Snackbar */}
      <Snackbar
        open={state.snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={state.snackbar.severity}>
          {state.snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Influencers;
