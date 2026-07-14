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
  const submitLockRef = React.useRef(false);

  const createSubmissionKey = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  };

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
    submissionKey: "",
  });

  const [influencers, setInfluencers] = React.useState([]);
  const prevStatusRef = React.useRef({});

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
        showSnackbar: false,
      });

      if (res?.data?.success) {
        const nextList = res.data.data || [];

        const prev = prevStatusRef.current || {};
        nextList.forEach((inf) => {
          const wasBusy =
            prev[inf.id] === "processing" || prev[inf.id] === "submitting";
          if (wasBusy && inf.status === "active" && inf.photo_url) {
            setState((s) => ({
              ...s,
              snackbar: {
                open: true,
                message:
                  lang.characterReady || `"${inf.name}" is ready`,
                severity: "success",
              },
            }));
          }
        });
        prevStatusRef.current = Object.fromEntries(
          nextList.map((inf) => [inf.id, inf.status]),
        );

        // Merge server list with any local optimistic processing cards not yet returned
        setInfluencers((prevList) => {
          const byId = new Map(nextList.map((item) => [item.id, item]));
          for (const item of prevList) {
            if (
              item?._optimistic &&
              (item.status === "processing" || item.status === "submitting") &&
              !byId.has(item.id)
            ) {
              byId.set(item.id, item);
            }
          }
          return Array.from(byId.values()).sort((a, b) => {
            const ta = new Date(a.created_at || 0).getTime();
            const tb = new Date(b.created_at || 0).getTime();
            return tb - ta;
          });
        });

        if (closeDialog) {
          setState((prevState) => ({
            ...prevState,
            dialog: false,
            activeStep: 0,
            creationType: "upload",
            photoPreview: null,
            photoFile: null,
            name: "",
            description: "",
            prompt: "",
            submissionKey: "",
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
  }, [hitAxios, lang.errorLoadingInfluencers, lang.characterReady]);

  React.useEffect(() => {
    fetchInfluencers();
  }, [fetchInfluencers]);

  // Auto-refresh while any influencer is generating (every 2.5s)
  React.useEffect(() => {
    const hasProcessing = influencers.some(
      (inf) => inf.status === "processing" || inf.status === "submitting",
    );
    if (!hasProcessing) return undefined;

    const intervalId = setInterval(() => {
      fetchInfluencers();
    }, 2500);

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
    submitLockRef.current = false;
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
      submissionKey: createSubmissionKey(),
    }));
  };

  const handleCloseDialog = () => {
    submitLockRef.current = false;
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
      submissionKey: "",
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
    if (submitLockRef.current || state.loading) return;

    submitLockRef.current = true;
    setState((prev) => ({ ...prev, loading: true }));

    const snapshot = {
      name: state.name,
      description: state.description,
      creationType: state.creationType,
      prompt: state.prompt,
      photoFile: state.photoFile,
      submissionKey: state.submissionKey || createSubmissionKey(),
    };

    try {
      const formData = new FormData();
      formData.append("name", snapshot.name);
      formData.append("description", snapshot.description);
      formData.append("creation_type", snapshot.creationType);
      formData.append("submission_key", snapshot.submissionKey);

      if (snapshot.creationType === "prompt") {
        formData.append("prompt", snapshot.prompt);
      }

      if (snapshot.photoFile) {
        formData.append("photo", snapshot.photoFile);
      }

      const res = await hitAxios({
        path: "/api/inf/add_model",
        post: true,
        admin: false,
        obj: formData,
        showLoading: false,
        showSnackbar: false,
      });

      if (res?.data?.success) {
        const created = res.data.data || {};
        const newId =
          created.id ||
          res.data.id ||
          `temp-${snapshot.submissionKey || Date.now()}`;

        const optimistic = {
          id: newId,
          uid: created.uid,
          name: snapshot.name,
          description: snapshot.description,
          creation_type: snapshot.creationType,
          prompt:
            snapshot.creationType === "prompt" ? snapshot.prompt : null,
          photo_url: created.photo_url || null,
          status: created.status || "processing",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          _optimistic: true,
        };

        prevStatusRef.current = {
          ...prevStatusRef.current,
          [optimistic.id]: optimistic.status,
        };

        // Show processing card immediately, then close dialog (no page reload)
        setInfluencers((prev) => {
          if (prev.some((item) => item.id === optimistic.id)) return prev;
          return [optimistic, ...prev];
        });

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
          submissionKey: "",
          loading: false,
          snackbar: {
            open: true,
            message:
              res.data.msg ||
              lang.characterQueued ||
              "Character is processing…",
            severity: "success",
          },
        }));
        submitLockRef.current = false;

        // Soft refresh — merge keeps optimistic card until server returns it
        setTimeout(() => {
          fetchInfluencers();
        }, 400);
        setTimeout(() => {
          getUserData();
        }, 1500);
        return;
      }

      showSnackbar(res?.data?.msg || "Something went wrong", "error");
    } catch (err) {
      showSnackbar("Error submitting form", "error");
    } finally {
      submitLockRef.current = false;
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
        showLoading: false,
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
                  ? `/media/${influencer.photo_url}${
                      influencer.updated_at
                        ? `?t=${encodeURIComponent(influencer.updated_at)}`
                        : ""
                    }`
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
                  type="button"
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
