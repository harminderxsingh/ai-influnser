import React from "react";
import {
  AddOutlined,
  RecordVoiceOver,
  CheckCircle,
  VolumeUpOutlined,
  StopOutlined,
  SearchOutlined,
  LanguageOutlined,
  MicOutlined,
  ArrowBackOutlined,
  AutoAwesome,
} from "@mui/icons-material";
import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  CardMedia,
  Skeleton,
} from "@mui/material";
import CommonDialog from "../../../common/CommonDialog";
import { GlobalContext } from "../../../context/GlobalContext";

const MAX_CHARS = 1000;

// ── Small influencer selector card ───────────────────────────
const InfSelectCard = ({ influencer, isSelected, onSelect }) => {
  const theme = useTheme();
  const hasPhoto = !!influencer?.photo_url;

  if (influencer?.status !== "active") return null;

  return (
    <Box
      onClick={() => onSelect(influencer)}
      sx={{
        position: "relative",
        cursor: "pointer",
        borderRadius: 2,
        overflow: "hidden",
        border: `2px solid ${
          isSelected ? theme.palette.primary.main : "transparent"
        }`,
        boxShadow: isSelected
          ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`
          : "none",
        transition: "all 0.2s ease",
        aspectRatio: "3/4",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.15)}`,
        },
      }}
    >
      {hasPhoto ? (
        <CardMedia
          component="img"
          image={`/media/${influencer.photo_url}`}
          alt={influencer.name}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 15%",
          }}
        />
      ) : (
        <Skeleton variant="rectangular" width="100%" height="100%" />
      )}

      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
          px: 1,
          pt: 3,
          pb: 1,
          pointerEvents: "none",
        }}
      >
        <Typography
          variant="caption"
          fontWeight={700}
          color="white"
          noWrap
          display="block"
        >
          {influencer.name}
        </Typography>
      </Box>

      {isSelected && (
        <Box sx={{ position: "absolute", top: 6, right: 6 }}>
          <CheckCircle
            sx={{
              fontSize: 22,
              color: (t) => t.palette.primary.main,
              bgcolor: "white",
              borderRadius: "50%",
              display: "block",
            }}
          />
        </Box>
      )}
    </Box>
  );
};

// ── Voice row ─────────────────────────────────────────────────
const VoiceRow = ({ voice, isSelected, onSelect, playingVoice, onPreview }) => {
  const theme = useTheme();
  const isPlaying = playingVoice === voice.name;

  const GENDER_COLOR = {
    female: "error",
    Female: "error",
    male: "primary",
    Male: "primary",
    neutral: "default",
  };

  return (
    <Box
      onClick={() => onSelect(voice)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: isSelected ? "primary.main" : "divider",
        bgcolor: isSelected
          ? alpha(theme.palette.primary.main, 0.06)
          : "background.paper",
        cursor: "pointer",
        transition: "all 0.15s",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        },
      }}
    >
      <Tooltip title={isPlaying ? "Stop" : "Preview voice"}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onPreview(voice);
          }}
          sx={{
            color: isPlaying ? "error.main" : "text.secondary",
            flexShrink: 0,
          }}
        >
          {isPlaying ? (
            <StopOutlined sx={{ fontSize: 16 }} />
          ) : (
            <VolumeUpOutlined sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Tooltip>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{ color: "#6366F1", fontFamily: "monospace" }}
        >
          {voice.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          {voice.fullName}
        </Typography>
      </Box>

      <Stack
        direction="row"
        gap={0.4}
        flexShrink={0}
        flexWrap="wrap"
        justifyContent="flex-end"
      >
        <Chip
          label={voice.gender}
          size="small"
          color={GENDER_COLOR[voice.gender] || "default"}
          variant="outlined"
          sx={{ fontSize: "0.6rem", height: 18 }}
        />
        <Chip
          label={voice.type}
          size="small"
          variant="outlined"
          sx={{ fontSize: "0.6rem", height: 18 }}
        />
      </Stack>

      {isSelected && (
        <CheckCircle
          sx={{ fontSize: 16, color: "primary.main", flexShrink: 0 }}
        />
      )}
    </Box>
  );
};

// ── Main AddNew ───────────────────────────────────────────────
const AddNew = ({ lang, inf, getVideos }) => {
  const theme = useTheme();
  const { hitAxios } = React.useContext(GlobalContext);

  const STEPS = [
    lang?.stepSelectModel || "Select Model",
    lang?.stepScript || "Write Script",
    lang?.stepVoice || "Pick Voice",
  ];

  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);

  // Form state
  const [selectedModel, setSelectedModel] = React.useState(null);
  const [text, setText] = React.useState("");
  const [selectedLang, setSelectedLang] = React.useState(null);
  const [selectedVoice, setSelectedVoice] = React.useState(null);
  const [gender, setGender] = React.useState("all");

  // Lang/voice data
  const [languages, setLanguages] = React.useState([]);
  const [voices, setVoices] = React.useState([]);
  const [langSearch, setLangSearch] = React.useState("");
  const [voiceSearch, setVoiceSearch] = React.useState("");
  const [loadingLangs, setLoadingLangs] = React.useState(false);
  const [loadingVoices, setLoadingVoices] = React.useState(false);
  const [langView, setLangView] = React.useState("lang");

  // Audio
  const [playingVoice, setPlayingVoice] = React.useState(null);
  const audioRef = React.useRef(null);

  // ── Fetch languages when step 2 opens ────────────────────────
  React.useEffect(() => {
    if (step === 2 && languages.length === 0) {
      fetchLanguages();
    }
  }, [step]);

  // ── Fetch voices when lang or gender changes ──────────────────
  React.useEffect(() => {
    if (selectedLang?.code) {
      fetchVoices(selectedLang.code, gender);
    }
  }, [selectedLang, gender]);

  async function fetchLanguages() {
    setLoadingLangs(true);
    try {
      const res = await hitAxios({
        path: "/api/talking/tts/languages",
        post: false,
        admin: false,
      });

      // Response: { success, languages: [{code, name}] }
      // No mapping needed — structure is already clean
      setLanguages(res?.data?.languages || []);
    } catch (e) {
      console.error("fetchLanguages failed:", e.message);
    } finally {
      setLoadingLangs(false);
    }
  }

  async function fetchVoices(langCode, genderFilter) {
    setLoadingVoices(true);
    setVoices([]);
    setSelectedVoice(null);
    try {
      const params = new URLSearchParams({ lang: langCode });
      if (genderFilter && genderFilter !== "all") {
        params.append("gender", genderFilter);
      }

      const res = await hitAxios({
        path: `/api/talking/tts/voices?${params.toString()}`,
        post: false,
        admin: false,
      });

      // Response: { success, voices: [{name, fullName, gender, type, category, engines, styles}] }
      // No mapping needed — structure matches exactly what VoiceRow expects
      setVoices(res?.data?.voices || []);
    } catch (e) {
      console.error("fetchVoices failed:", e.message);
    } finally {
      setLoadingVoices(false);
    }
  }

  // ── Voice preview — exact same logic from UserDocs ────────────
  function previewVoice(voice) {
    const voiceName = voice.name;

    if (playingVoice === voiceName) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      setPlayingVoice(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    const fileName = voiceName.toLowerCase();
    const url = `https://voicesuiteapp.com/voices/${fileName}.mp3`;

    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingVoice(voiceName);

    audio.play().catch(() => {
      setPlayingVoice(null);
      audioRef.current = null;
    });

    audio.onended = () => {
      setPlayingVoice(null);
      audioRef.current = null;
    };

    audio.onerror = () => {
      setPlayingVoice(null);
      audioRef.current = null;
    };
  }

  function handleClose() {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingVoice(null);
    setOpen(false);
    setStep(0);
    setSelectedModel(null);
    setText("");
    setSelectedLang(null);
    setSelectedVoice(null);
    setGender("all");
    setLangView("lang");
    setLangSearch("");
    setVoiceSearch("");
  }

  async function handleSubmit() {
    setSaving(true);
    const res = await hitAxios({
      path: "/api/talking/add_new_task",
      post: true,
      admin: false,
      obj: {
        selectedModel,
        text,
        voice: selectedVoice?.name || "en-US-AriaNeural",
        lang: selectedLang?.code || "en-US",
        gender: gender === "all" ? "female" : gender,
        voice_style: "general",
        project_style: "close_up",
        aspect_ratio: "9:16",
        character_style: "realistic",
      },
    });
    setSaving(false);
    if (res?.data?.success) {
      getVideos();
      handleClose();
    }
  }

  // ── Filtered lists ────────────────────────────────────────────
  const filteredLangs = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.code.toLowerCase().includes(langSearch.toLowerCase()),
  );

  const filteredVoices = voices.filter((v) =>
    [v.name, v.fullName, v.type]
      .join(" ")
      .toLowerCase()
      .includes(voiceSearch.toLowerCase()),
  );

  const canNext =
    step === 0
      ? !!selectedModel
      : step === 1
        ? text.trim().length > 0 && text.length <= MAX_CHARS
        : !!selectedVoice;

  // ── Step content ──────────────────────────────────────────────
  const renderStep = () => {
    // STEP 0 — Select influencer
    if (step === 0) {
      const activeInf = inf.filter((i) => i.status === "active");
      return (
        <Box>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {lang?.selectModelHint ||
              "Pick the influencer whose face will appear in the talking video."}
          </Typography>
          {activeInf.length === 0 ? (
            <Box
              sx={{
                py: 6,
                textAlign: "center",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="text.disabled">
                {lang?.noActiveInfluencers ||
                  "No active influencers found. Create one first."}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                gap: 1.5,
                maxHeight: 380,
                overflowY: "auto",
                pr: 0.5,
              }}
            >
              {activeInf.map((influencer) => (
                <InfSelectCard
                  key={influencer.id}
                  influencer={influencer}
                  isSelected={selectedModel?.id === influencer.id}
                  onSelect={setSelectedModel}
                />
              ))}
            </Box>
          )}
        </Box>
      );
    }

    // STEP 1 — Write script
    if (step === 1) {
      const charCount = text.length;
      const isOver = charCount > MAX_CHARS;

      return (
        <Box>
          {selectedModel && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                mb: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              }}
            >
              <Box
                component="img"
                src={`/media/${selectedModel.photo_url}`}
                alt={selectedModel.name}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  objectFit: "cover",
                  objectPosition: "top",
                }}
              />
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {selectedModel.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {lang?.selectedModel || "Selected model"}
                </Typography>
              </Box>
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" mb={1.5}>
            {lang?.scriptHint ||
              "Write the script your influencer will speak. ~1000 characters ≈ 1 minute."}
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={7}
            placeholder={
              lang?.scriptPlaceholder ||
              "Hello! Welcome to my channel. Today I'm going to show you something amazing..."
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            error={isOver}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ mt: 0.5, px: 0.5 }}
          >
            <Typography
              variant="caption"
              color={isOver ? "error" : "text.secondary"}
            >
              {isOver
                ? lang?.scriptTooLong || "Script too long"
                : lang?.scriptHelperText ||
                  "~1000 characters ≈ 1 minute of speech"}
            </Typography>
            <Typography
              variant="caption"
              color={isOver ? "error.main" : "text.secondary"}
              fontWeight={600}
            >
              {charCount} / {MAX_CHARS}
            </Typography>
          </Stack>
        </Box>
      );
    }

    // STEP 2 — Pick voice
    if (step === 2) {
      return (
        <Box>
          {/* Lang / Voice tab buttons */}
          <Stack direction="row" gap={1} mb={2}>
            <Button
              size="small"
              variant={langView === "lang" ? "contained" : "outlined"}
              startIcon={<LanguageOutlined />}
              onClick={() => setLangView("lang")}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              {lang?.language || "Language"}
              {selectedLang && (
                <Chip
                  label={selectedLang.code}
                  size="small"
                  sx={{ ml: 0.75, height: 18, fontSize: "0.6rem" }}
                />
              )}
            </Button>
            <Button
              size="small"
              variant={langView === "voice" ? "contained" : "outlined"}
              startIcon={<MicOutlined />}
              disabled={!selectedLang}
              onClick={() => selectedLang && setLangView("voice")}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              {lang?.voice || "Voice"}
              {selectedVoice && (
                <Chip
                  label={selectedVoice.name.split("-").slice(-1)[0]}
                  size="small"
                  sx={{ ml: 0.75, height: 18, fontSize: "0.6rem" }}
                />
              )}
            </Button>
          </Stack>

          {/* ── LANGUAGE VIEW ── */}
          {langView === "lang" && (
            <Box>
              <TextField
                fullWidth
                size="small"
                placeholder={lang?.searchLanguage || "Search language..."}
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined fontSize="small" color="disabled" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 1.5,
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              />

              {loadingLangs ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.75,
                    maxHeight: 260,
                    overflowY: "auto",
                    pr: 0.5,
                  }}
                >
                  {filteredLangs.map((l) => {
                    const isSelected = selectedLang?.code === l.code;
                    return (
                      <Chip
                        key={l.code}
                        label={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <code
                              style={{ fontSize: "0.7rem", color: "#6366F1" }}
                            >
                              {l.code}
                            </code>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.68rem" }}
                            >
                              — {l.name}
                            </Typography>
                          </Box>
                        }
                        size="small"
                        variant={isSelected ? "filled" : "outlined"}
                        color={isSelected ? "primary" : "default"}
                        onClick={() => {
                          setSelectedLang(l);
                          setLangView("voice");
                        }}
                        sx={{
                          cursor: "pointer",
                          height: "auto",
                          py: 0.4,
                          "&:hover": { borderColor: "primary.main" },
                        }}
                      />
                    );
                  })}
                  {filteredLangs.length === 0 && !loadingLangs && (
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ py: 3, width: "100%", textAlign: "center" }}
                    >
                      {lang?.noLanguagesFound || "No languages found"}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* ── VOICE VIEW ── */}
          {langView === "voice" && selectedLang && (
            <Box>
              {/* Back + gender filter */}
              <Stack
                direction="row"
                gap={1}
                mb={1.5}
                flexWrap="wrap"
                alignItems="center"
              >
                <Button
                  size="small"
                  startIcon={<ArrowBackOutlined />}
                  onClick={() => setLangView("lang")}
                  sx={{ textTransform: "none", fontSize: "0.75rem" }}
                >
                  {selectedLang.name}
                </Button>
                <Box sx={{ flex: 1 }} />
                {["all", "female", "male"].map((g) => (
                  <Chip
                    key={g}
                    label={g.charAt(0).toUpperCase() + g.slice(1)}
                    size="small"
                    variant={gender === g ? "filled" : "outlined"}
                    color={
                      gender === g
                        ? g === "female"
                          ? "error"
                          : g === "male"
                            ? "primary"
                            : "default"
                        : "default"
                    }
                    onClick={() => setGender(g)}
                    sx={{ cursor: "pointer", fontSize: "0.7rem" }}
                  />
                ))}
              </Stack>

              <TextField
                fullWidth
                size="small"
                placeholder={lang?.searchVoice || "Search voice..."}
                value={voiceSearch}
                onChange={(e) => setVoiceSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined fontSize="small" color="disabled" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 1.5,
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              />

              {loadingVoices ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <Stack
                  spacing={0.5}
                  sx={{ maxHeight: 260, overflowY: "auto", pr: 0.5 }}
                >
                  {filteredVoices.map((voice) => (
                    <VoiceRow
                      key={voice.name}
                      voice={voice}
                      isSelected={selectedVoice?.name === voice.name}
                      onSelect={setSelectedVoice}
                      playingVoice={playingVoice}
                      onPreview={previewVoice}
                    />
                  ))}
                  {filteredVoices.length === 0 && !loadingVoices && (
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ py: 3, textAlign: "center" }}
                    >
                      {lang?.noVoicesFound || "No voices found"}
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>
          )}
        </Box>
      );
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="large"
        startIcon={<AddOutlined />}
        variant="contained"
      >
        {lang?.addNew || "Add New"}
      </Button>

      <CommonDialog
        icon={RecordVoiceOver}
        title={lang?.newTalkingVideo || "New Talking Video"}
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
      >
        <Box sx={{ pt: 1 }}>
          <Stepper activeStep={step} sx={{ mb: 3 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>
                  <Typography variant="caption" fontWeight={600}>
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 320 }}>{renderStep()}</Box>

          <Divider sx={{ my: 2 }} />

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Button
              onClick={() =>
                step === 0 ? handleClose() : setStep((s) => s - 1)
              }
              variant="outlined"
              color="inherit"
              size="small"
            >
              {step === 0 ? lang?.cancel || "Cancel" : lang?.back || "Back"}
            </Button>

            <Stack direction="row" gap={1} alignItems="center">
              <Typography variant="caption" color="text.disabled">
                {step + 1} / {STEPS.length}
              </Typography>

              {step < STEPS.length - 1 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  variant="contained"
                  size="small"
                  disabled={!canNext}
                >
                  {lang?.next || "Next"}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  size="small"
                  disabled={!canNext || saving}
                  startIcon={
                    saving ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <AutoAwesome />
                    )
                  }
                >
                  {saving
                    ? lang?.generating || "Generating..."
                    : lang?.generate || "Generate"}
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      </CommonDialog>
    </>
  );
};

export default AddNew;
