import React from "react";
import PageHeader from "../../common/PageHeader";
import {
  Language,
  SaveOutlined,
  UploadFileOutlined,
  PrivacyTipOutlined,
  GavelOutlined,
  InfoOutlined,
  GroupAddOutlined,
  CurrencyExchangeOutlined,
} from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";
import {
  Box,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  Button,
  CircularProgress,
  Avatar,
  Stack,
  useTheme,
  alpha,
  Chip,
} from "@mui/material";

const Section = ({ title, icon: Icon, chip, children }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        p: 3,
        mb: 3,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
        {Icon && (
          <Icon
            sx={{
              fontSize: 16,
              color: theme.palette.primary.main,
              opacity: 0.7,
            }}
          />
        )}
        <Typography
          variant="overline"
          fontWeight={700}
          letterSpacing={2}
          color="text.disabled"
        >
          {title}
        </Typography>
        {chip && (
          <Chip label={chip} size="small" color="primary" variant="outlined" />
        )}
      </Stack>
      {children}
    </Box>
  );
};

const SiteSettings = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const theme = useTheme();

  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState({});

  const [form, setForm] = React.useState({
    site_name: "",
    site_logo: "",
    site_favicon: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    og_title: "",
    og_description: "",
    og_image: "",
    google_analytics_id: "",
    google_tag_manager_id: "",
    facebook_pixel_id: "",
    custom_homepage_enabled: false,
    custom_homepage_url: "",
    youtube_tutorial_url: "",
    currency_symbol: "$",
    currency_code: "USD",
    currency_exchange_rate: "1",
    referral_enabled: true,
    referral_signup_credits: 0,
    referral_referrer_credits: 0,
    privacy_policy_html: "",
    tnc_html: "",
    about_us_html: "",
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  React.useEffect(() => {
    (async () => {
      const res = await hitAxios({
        path: "/api/web/get_web_public",
        post: false,
        admin: true,
      });
      if (res.data.success && res.data.data) {
        const d = res.data.data;
        setForm({
          site_name: d.site_name || "",
          site_logo: d.site_logo || "",
          site_favicon: d.site_favicon || "",
          meta_title: d.meta_title || "",
          meta_description: d.meta_description || "",
          meta_keywords: d.meta_keywords || "",
          og_title: d.og_title || "",
          og_description: d.og_description || "",
          og_image: d.og_image || "",
          google_analytics_id: d.google_analytics_id || "",
          google_tag_manager_id: d.google_tag_manager_id || "",
          facebook_pixel_id: d.facebook_pixel_id || "",
          custom_homepage_enabled: d.custom_homepage_enabled === 1,
          custom_homepage_url: d.custom_homepage_url || "",
          youtube_tutorial_url: d.youtube_tutorial_url || "",
          currency_symbol: d.currency_symbol || "$",
          currency_code: d.currency_code || "USD",
          currency_exchange_rate: (() => {
            const rate = parseFloat(d.currency_exchange_rate);
            return Number.isFinite(rate) && rate > 1 ? String(rate) : "95";
          })(),
          referral_enabled: d.referral_enabled !== 0,
          referral_signup_credits: d.referral_signup_credits || 0,
          referral_referrer_credits: d.referral_referrer_credits || 0,
          privacy_policy_html: d.privacy_policy_html || "",
          tnc_html: d.tnc_html || "",
          about_us_html: d.about_us_html || "",
        });
      }
    })();
  }, []);

  const handleFileChange = async (e, field, type = "media") => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading((p) => ({ ...p, [field]: true }));

    const fd = new FormData();
    fd.append("file", file);

    const res = await hitAxios({
      path:
        type === "favicon"
          ? "/api/web/upload_favicon"
          : "/api/web/upload_media",
      post: true,
      admin: true,
      obj: fd,
    });

    if (res.data.success) {
      set(field, res.data.filename);
    }

    setUploading((p) => ({ ...p, [field]: false }));
  };

  const handleSave = async () => {
    setSaving(true);
    const exchangeRate = parseFloat(form.currency_exchange_rate);
    const res = await hitAxios({
      path: "/api/web/save_web_public",
      post: true,
      admin: true,
      obj: {
        ...form,
        currency_symbol: "$",
        currency_code: "USD",
        currency_exchange_rate:
          Number.isFinite(exchangeRate) && exchangeRate > 0 ? exchangeRate : 95,
        custom_homepage_enabled: form.custom_homepage_enabled ? 1 : 0,
        referral_enabled: form.referral_enabled ? 1 : 0,
      },
    });
    setSaving(false);

    if (res?.data?.success) {
      setForm((prev) => ({
        ...prev,
        currency_exchange_rate: String(
          Number.isFinite(exchangeRate) && exchangeRate > 0 ? exchangeRate : 95,
        ),
      }));
    }
  };

  const mediaUrl = (name) => (name ? `/media/${name}` : null);

  // ── reusable HTML editor field ──
  const HtmlField = ({ field, label, hint }) => (
    <Grid item xs={12}>
      <Stack spacing={1}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
          <Chip
            label={lang?.htmlSupported || "HTML Supported"}
            size="small"
            variant="outlined"
            color="info"
            sx={{ fontSize: 10, height: 20 }}
          />
        </Stack>
        <TextField
          fullWidth
          multiline
          rows={14}
          value={form[field]}
          onChange={(e) => set(field, e.target.value)}
          placeholder={hint}
          InputProps={{
            sx: {
              fontFamily: "monospace",
              fontSize: 13,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              "& textarea": { lineHeight: 1.7 },
            },
          }}
        />
        {form[field] && (
          <Box
            sx={{
              border: `1px dashed ${theme.palette.divider}`,
              borderRadius: 2,
              p: 2,
              maxHeight: 200,
              overflowY: "auto",
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Typography
              variant="caption"
              color="text.disabled"
              display="block"
              mb={1}
              fontWeight={600}
              letterSpacing={1}
            >
              {lang?.preview || "PREVIEW"}
            </Typography>
            <Box
              sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: form[field] }}
            />
          </Box>
        )}
      </Stack>
    </Grid>
  );

  return (
    <Box>
      <PageHeader
        title={lang?.siteSettings || "Site Settings"}
        subtitle={lang?.siteSettingsSub || "Manage site logo, SEO and tags"}
        icon={Language}
        primaryAction={
          <Button
            variant="contained"
            size="large"
            startIcon={
              saving ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SaveOutlined />
              )
            }
            onClick={handleSave}
            disabled={saving}
            sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
          >
            {saving
              ? lang?.saving || "Saving..."
              : lang?.saveSettings || "Save Settings"}
          </Button>
        }
      />

      <Box sx={{ mx: "auto", mt: 3, px: { xs: 2, md: 0 } }}>
        {/* ── BRANDING ── */}
        <Section title={lang?.branding || "Branding"}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label={lang?.siteName || "Site Name"}
                value={form.site_name}
                onChange={(e) => set("site_name", e.target.value)}
              />
            </Grid>

            {/* Logo */}
            <Grid item xs={12} sm={6}>
              <Typography
                variant="caption"
                color="text.secondary"
                mb={1}
                display="block"
              >
                {lang?.siteLogo || "Site Logo"}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                {form.site_logo && (
                  <Avatar
                    src={mediaUrl(form.site_logo)}
                    variant="rounded"
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    }}
                  />
                )}
                <Button
                  component="label"
                  size="small"
                  variant="outlined"
                  startIcon={
                    uploading.site_logo ? (
                      <CircularProgress size={14} />
                    ) : (
                      <UploadFileOutlined />
                    )
                  }
                  disabled={uploading.site_logo}
                >
                  {lang?.upload || "Upload"}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "site_logo")}
                  />
                </Button>
              </Stack>
            </Grid>

            {/* Favicon */}
            <Grid item xs={12} sm={6}>
              <Typography
                variant="caption"
                color="text.secondary"
                mb={1}
                display="block"
              >
                {lang?.siteFavicon ||
                  "Favicon (any image → auto converted to 64×64 .ico)"}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                {form.site_favicon && (
                  <Avatar
                    src="/favicon.ico"
                    variant="rounded"
                    sx={{ width: 32, height: 32 }}
                  />
                )}
                <Button
                  component="label"
                  size="small"
                  variant="outlined"
                  startIcon={
                    uploading.site_favicon ? (
                      <CircularProgress size={14} />
                    ) : (
                      <UploadFileOutlined />
                    )
                  }
                  disabled={uploading.site_favicon}
                >
                  {lang?.upload || "Upload"}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileChange(e, "site_favicon", "favicon")
                    }
                  />
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Section>

        {/* ── SEO ── */}
        <Section title={lang?.seoMeta || "SEO & Meta"}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label={lang?.metaTitle || "Meta Title"}
                value={form.meta_title}
                onChange={(e) => set("meta_title", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label={lang?.metaDescription || "Meta Description"}
                value={form.meta_description}
                onChange={(e) => set("meta_description", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label={lang?.metaKeywords || "Meta Keywords"}
                value={form.meta_keywords}
                onChange={(e) => set("meta_keywords", e.target.value)}
                helperText={lang?.commaSeparated || "Comma separated"}
              />
            </Grid>
          </Grid>
        </Section>

        {/* ── OG ── */}
        <Section title={lang?.openGraph || "Open Graph (OG)"}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label={lang?.ogTitle || "OG Title"}
                value={form.og_title}
                onChange={(e) => set("og_title", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label={lang?.ogDescription || "OG Description"}
                value={form.og_description}
                onChange={(e) => set("og_description", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="caption"
                color="text.secondary"
                mb={1}
                display="block"
              >
                {lang?.ogImage || "OG Image"}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                {form.og_image && (
                  <Box
                    component="img"
                    src={mediaUrl(form.og_image)}
                    sx={{
                      height: 60,
                      borderRadius: 1.5,
                      border: `1px solid ${theme.palette.divider}`,
                      objectFit: "cover",
                    }}
                  />
                )}
                <Button
                  component="label"
                  size="small"
                  variant="outlined"
                  startIcon={
                    uploading.og_image ? (
                      <CircularProgress size={14} />
                    ) : (
                      <UploadFileOutlined />
                    )
                  }
                  disabled={uploading.og_image}
                >
                  {lang?.upload || "Upload"}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "og_image")}
                  />
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Section>

        {/* ── ANALYTICS ── */}
        <Section title={lang?.analyticsTracking || "Analytics & Tracking"}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label={lang?.googleAnalyticsId || "Google Analytics ID"}
                placeholder="G-XXXXXXXXXX"
                value={form.google_analytics_id}
                onChange={(e) => set("google_analytics_id", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label={lang?.googleTagManagerId || "Google Tag Manager ID"}
                placeholder="GTM-XXXXXXX"
                value={form.google_tag_manager_id}
                onChange={(e) => set("google_tag_manager_id", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label={lang?.facebookPixelId || "Facebook Pixel ID"}
                placeholder="XXXXXXXXXXXXXXXXXX"
                value={form.facebook_pixel_id}
                onChange={(e) => set("facebook_pixel_id", e.target.value)}
              />
            </Grid>
          </Grid>
        </Section>

        {/* ── HOMEPAGE ── */}
        <Section title={lang?.homepage || "Homepage"}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.custom_homepage_enabled}
                    onChange={(e) =>
                      set("custom_homepage_enabled", e.target.checked)
                    }
                    color="primary"
                  />
                }
                label={lang?.enableCustomHomepage || "Enable Custom Homepage"}
              />
            </Grid>
            {form.custom_homepage_enabled && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label={lang?.customHomepageUrl || "Custom Homepage URL"}
                  placeholder="https://example.com"
                  value={form.custom_homepage_url}
                  onChange={(e) => set("custom_homepage_url", e.target.value)}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label={lang?.youtubeTutorialUrl || "YouTube Tutorial URL"}
                placeholder="https://youtube.com/watch?v=..."
                value={form.youtube_tutorial_url}
                onChange={(e) => set("youtube_tutorial_url", e.target.value)}
              />
            </Grid>
          </Grid>
        </Section>

        {/* ── CURRENCY ── */}
        <Section
          title={lang?.currencySettings || "Currency Settings"}
          icon={CurrencyExchangeOutlined}
          chip="USD → INR"
        >
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                {lang?.usdInrCurrencyInfo ||
                  "Plan and credit package prices are stored in USD. India visitors see and pay in INR using the rate below."}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label={lang?.baseCurrency || "Base Currency (Admin Entry)"}
                value="USD ($)"
                InputProps={{ readOnly: true }}
                helperText={
                  lang?.baseCurrencyHint ||
                  "Enter plan/package prices in USD everywhere in admin"
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label={lang?.usdToInrRate || "USD to INR Rate"}
                value={form.currency_exchange_rate}
                onChange={(e) => set("currency_exchange_rate", e.target.value)}
                inputProps={{ min: 1, step: "0.01" }}
                helperText={
                  lang?.usdToInrRateHint ||
                  "Example: 95 means $1 = ₹95 for India users (display + Razorpay)"
                }
              />
            </Grid>
          </Grid>
        </Section>

        {/* ── REFERRALS ── */}
        <Section title={lang?.referralSettings || "Referral Settings"} icon={GroupAddOutlined}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.referral_enabled}
                    onChange={(e) => set("referral_enabled", e.target.checked)}
                  />
                }
                label={lang?.enableReferral || "Enable Referral Rewards"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label={lang?.signupCredits || "Signup Bonus Credits"}
                value={form.referral_signup_credits}
                onChange={(e) => set("referral_signup_credits", e.target.value)}
                helperText={
                  lang?.signupCreditsHint ||
                  "Credits given to the new user when they sign up"
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label={lang?.referrerCredits || "Referrer Reward Credits"}
                value={form.referral_referrer_credits}
                onChange={(e) =>
                  set("referral_referrer_credits", e.target.value)
                }
                helperText={
                  lang?.referrerCreditsHint ||
                  "Credits given to the user whose referral code was used"
                }
              />
            </Grid>
          </Grid>
        </Section>

        {/* ── PRIVACY POLICY ── */}
        <Section
          title={lang?.privacyPolicy || "Privacy Policy"}
          icon={PrivacyTipOutlined}
        >
          <Grid container>
            <HtmlField
              field="privacy_policy_html"
              label={lang?.privacyPolicyHtml || "Privacy Policy Content"}
              hint={`<h2>Privacy Policy</h2>\n<p>Your privacy policy content here...</p>`}
            />
          </Grid>
        </Section>

        {/* ── TERMS & CONDITIONS ── */}
        <Section
          title={lang?.termsConditions || "Terms & Conditions"}
          icon={GavelOutlined}
        >
          <Grid container>
            <HtmlField
              field="tnc_html"
              label={lang?.tncHtml || "Terms & Conditions Content"}
              hint={`<h2>Terms & Conditions</h2>\n<p>Your terms and conditions here...</p>`}
            />
          </Grid>
        </Section>

        {/* ── ABOUT US ── */}
        <Section title={lang?.aboutUs || "About Us"} icon={InfoOutlined}>
          <Grid container>
            <HtmlField
              field="about_us_html"
              label={lang?.aboutUsHtml || "About Us Content"}
              hint={`<h2>About Us</h2>\n<p>Tell your story here...</p>`}
            />
          </Grid>
        </Section>
      </Box>
    </Box>
  );
};

export default SiteSettings;
