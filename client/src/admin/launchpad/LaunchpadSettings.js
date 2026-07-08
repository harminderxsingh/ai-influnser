import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { DeleteOutlined, EditOutlined, WebhookOutlined } from "@mui/icons-material";
import PageHeader from "../../common/PageHeader";
import { GlobalContext } from "../../context/GlobalContext";

const LaunchpadSettings = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const [saving, setSaving] = React.useState(false);
  const [plans, setPlans] = React.useState([]);
  const emptyPage = {
    id: null,
    page_path: "",
    product_name: "",
    plan_id: "",
    embed_html: "",
    active: true,
  };
  const [form, setForm] = React.useState({
    active: false,
    page_slug: "launchpad",
    webhook_secret: "",
    webhook_url: "",
    pages: [],
  });
  const [pageForm, setPageForm] = React.useState(emptyPage);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setPage = (key, value) =>
    setPageForm((prev) => ({ ...prev, [key]: value }));

  const loadSettings = React.useCallback(async () => {
    try {
      const res = await hitAxios({
        path: "/api/launchpad/settings",
        admin: true,
        post: false,
        showLoading: false,
      });
      if (res?.data?.success) {
        setForm((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch (_) {}
  }, [hitAxios]);

  const loadPlans = React.useCallback(async () => {
    const res = await hitAxios({
      path: "/api/plan/get_all",
      admin: false,
      post: false,
      showLoading: false,
    });
    if (res?.data?.success) setPlans(res.data.data || res.data.plans || []);
  }, [hitAxios]);

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await hitAxios({
        path: "/api/launchpad/settings",
        admin: true,
        post: true,
        obj: form,
        showLoading: false,
      });
      if (res?.data?.success) {
        setForm((prev) => ({ ...prev, ...res.data.data }));
      }
    } finally {
      setSaving(false);
    }
  }

  async function savePage() {
    setSaving(true);
    try {
      const res = await hitAxios({
        path: "/api/launchpad/pages",
        admin: true,
        post: true,
        obj: pageForm,
        showLoading: false,
      });
      if (res?.data?.success) {
        setForm((prev) => ({ ...prev, pages: res.data.data || [] }));
        setPageForm(emptyPage);
      }
    } finally {
      setSaving(false);
    }
  }

  async function deletePage(id) {
    if (!window.confirm(lang?.confirmDelete || "Delete this Launchpad page?")) {
      return;
    }
    const res = await hitAxios({
      path: "/api/launchpad/pages/delete",
      admin: true,
      post: true,
      obj: { id },
      showLoading: false,
    });
    if (res?.data?.success) {
      setForm((prev) => ({ ...prev, pages: res.data.data || [] }));
      if (pageForm.id === id) setPageForm(emptyPage);
    }
  }

  React.useEffect(() => {
    loadSettings();
    loadPlans();
  }, [loadSettings, loadPlans]);

  return (
    <Box>
      <PageHeader
        title={lang?.launchpadSettings || "Launchpad JV Pages"}
        subtitle={
          lang?.launchpadSettingsSub ||
          "Manage the standalone Launchpad checkout page and sale webhook."
        }
        icon={WebhookOutlined}
        primaryAction={null}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Stack spacing={2.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Switch
                    checked={!!form.active}
                    onChange={(e) => set("active", e.target.checked)}
                  />
                  <Typography fontWeight={700}>
                    {lang?.enableLaunchpad || "Enable Launchpad page"}
                  </Typography>
                </Stack>

                <TextField
                  label={lang?.launchpadWebhookSecret || "Webhook Secret"}
                  value={form.webhook_secret || ""}
                  onChange={(e) => set("webhook_secret", e.target.value)}
                  helperText={
                    lang?.launchpadWebhookSecretHint ||
                    "Optional. If set, Launchpad must send this as ?secret=... or x-launchpad-secret header."
                  }
                  fullWidth
                />

                <Button variant="contained" onClick={saveSettings} disabled={saving}>
                  {saving ? lang?.saving || "Saving..." : lang?.saveSettings || "Save Settings"}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={800}>
                  {pageForm.id
                    ? lang?.editLaunchpadPage || "Edit Launchpad Page"
                    : lang?.addLaunchpadPage || "Add Launchpad Page"}
                </Typography>

                <TextField
                  label={lang?.launchpadPath || "Public URL Path"}
                  value={pageForm.page_path}
                  onChange={(e) => setPage("page_path", e.target.value)}
                  placeholder="dfy/ds"
                  helperText={
                    lang?.launchpadPathHint ||
                    "Examples: dfy, dfy/ds, reseller, enterprise. This creates /dfy or /dfy/ds."
                  }
                  fullWidth
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={lang?.launchpadProductName || "Launchpad Product Name"}
                      value={pageForm.product_name}
                      onChange={(e) => setPage("product_name", e.target.value)}
                      placeholder="GeminAI 3.5 DFY DS"
                      helperText={
                        lang?.launchpadProductNameHint ||
                        "Should match Launchpad webhook product.name."
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label={lang?.linkedPlan || "Linked Plan"}
                      value={pageForm.plan_id || ""}
                      onChange={(e) => setPage("plan_id", e.target.value)}
                      helperText={
                        lang?.linkedPlanHint ||
                        "Webhook will activate this plan for matching product name."
                      }
                      fullWidth
                    >
                      <MenuItem value="">Auto match by plan title</MenuItem>
                      {plans.map((plan) => (
                        <MenuItem key={plan.id} value={plan.id}>
                          {plan.title}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <TextField
                  label={lang?.launchpadEmbedSnippet || "Launchpad Embed Snippet"}
                  value={pageForm.embed_html}
                  onChange={(e) => setPage("embed_html", e.target.value)}
                  placeholder={`<div class="forgeContainer" data-offer="406" data-page="3199" data-id="3869"></div><script src="https://launchpadjv.com/js/embed.js"></script>`}
                  multiline
                  minRows={5}
                  fullWidth
                />

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Switch
                    checked={!!pageForm.active}
                    onChange={(e) => setPage("active", e.target.checked)}
                  />
                  <Typography>{lang?.active || "Active"}</Typography>
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={savePage} disabled={saving}>
                    {pageForm.id ? lang?.update || "Update" : lang?.add || "Add"}
                  </Button>
                  {pageForm.id && (
                    <Button onClick={() => setPageForm(emptyPage)}>
                      {lang?.cancel || "Cancel"}
                    </Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            <Alert severity="info">
              {lang?.launchpadPlanMatchInfo ||
                "Create one row per Launchpad offer. Example paths: dfy, dfy/ds, reseller, enterprise. URLs become yoursite.com/dfy and yoursite.com/dfy/ds with each offer's own embed script."}
            </Alert>

            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <TextField
                    label={lang?.webhookUrl || "Webhook URL"}
                    value={
                      form.webhook_secret
                        ? `${form.webhook_url}?secret=${form.webhook_secret}`
                        : form.webhook_url || ""
                    }
                    InputProps={{ readOnly: true }}
                    fullWidth
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {lang?.launchpadWebhookHint ||
                      "Use this webhook URL inside Launchpad. Successful SALE events will create/update the user and activate the matching plan."}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={800} mb={2}>
                  {lang?.launchpadPages || "Launchpad Pages"}
                </Typography>
                <Stack spacing={1.5}>
                  {(form.pages || []).length < 1 && (
                    <Typography variant="body2" color="text.secondary">
                      {lang?.noLaunchpadPages || "No Launchpad pages added yet."}
                    </Typography>
                  )}
                  {(form.pages || []).map((page) => (
                    <Box
                      key={page.id}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 1.5,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" gap={1}>
                        <Box minWidth={0}>
                          <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                            <Typography fontWeight={800} noWrap>
                              /{page.page_path}
                            </Typography>
                            <Chip
                              size="small"
                              color={page.active ? "success" : "default"}
                              label={page.active ? "Active" : "Inactive"}
                            />
                          </Stack>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {page.product_name || "No product name"}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" display="block">
                            Plan: {page.plan_title || "Auto match"}
                          </Typography>
                          <Typography variant="caption" color="primary" display="block">
                            {page.public_url}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setPageForm({
                                id: page.id,
                                page_path: page.page_path || "",
                                product_name: page.product_name || "",
                                plan_id: page.plan_id || "",
                                embed_html: page.embed_html || "",
                                active: !!page.active,
                              })
                            }
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => deletePage(page.id)}>
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LaunchpadSettings;
