const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "../routes/themes");

const palettes = {
  default: {
    primary_light: "#4F46E5",
    primary_dark: "#818CF8",
    secondary_light: "#7C3AED",
    secondary_dark: "#C4B5FD",
    accent_light: "#06B6D4",
    accent_dark: "#22D3EE",
    background_default_light: "#F5F7FF",
    background_paper_light: "#FFFFFF",
    background_default_dark: "#0B0F1A",
    background_paper_dark: "#121826",
    text_primary_light: "#0F172A",
    text_secondary_light: "#64748B",
    text_disabled_light: "#94A3B8",
    text_primary_dark: "#F8FAFC",
    text_secondary_dark: "#94A3B8",
    text_disabled_dark: "#64748B",
    divider_light: "#E2E8F0",
    divider_dark: "#1E293B",
    border_light: "#E2E8F0",
    border_dark: "#1E293B",
    action_hover_light: "rgba(79,70,229,0.06)",
    action_hover_dark: "rgba(129,140,248,0.1)",
    action_selected_light: "rgba(79,70,229,0.12)",
    action_selected_dark: "rgba(129,140,248,0.16)",
    btnLight: "#4F46E5",
    btnDark: "#818CF8",
    btnTextL: "#FFFFFF",
    btnTextD: "#0B0F1A",
    outBorderL: "#4F46E5",
    outBorderD: "#818CF8",
    outColorL: "#4F46E5",
    outColorD: "#818CF8",
    gradients: {
      gradient_primary_light:
        "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)",
      gradient_primary_dark:
        "linear-gradient(135deg, #818CF8 0%, #C4B5FD 50%, #22D3EE 100%)",
      gradient_secondary:
        "linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #06B6D4 100%)",
      gradient_success: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
      gradient_primary: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
    },
  },
  "theme-sharp": {
    primary_light: "#2563EB",
    primary_dark: "#60A5FA",
    secondary_light: "#DB2777",
    secondary_dark: "#F472B6",
    accent_light: "#F59E0B",
    accent_dark: "#FCD34D",
    background_default_light: "#F8FAFC",
    background_paper_light: "#FFFFFF",
    background_default_dark: "#020617",
    background_paper_dark: "#0F172A",
    text_primary_light: "#0F172A",
    text_secondary_light: "#475569",
    text_disabled_light: "#94A3B8",
    text_primary_dark: "#F8FAFC",
    text_secondary_dark: "#94A3B8",
    text_disabled_dark: "#64748B",
    divider_light: "#CBD5E1",
    divider_dark: "#1E293B",
    border_light: "#93C5FD",
    border_dark: "#1E3A8A",
    action_hover_light: "rgba(37,99,235,0.08)",
    action_hover_dark: "rgba(96,165,250,0.12)",
    action_selected_light: "rgba(37,99,235,0.16)",
    action_selected_dark: "rgba(96,165,250,0.2)",
    btnLight: "#2563EB",
    btnDark: "#60A5FA",
    btnTextL: "#FFFFFF",
    btnTextD: "#020617",
    outBorderL: "#2563EB",
    outBorderD: "#60A5FA",
    outColorL: "#2563EB",
    outColorD: "#60A5FA",
    gradients: {
      gradient_primary_light: "linear-gradient(90deg, #2563EB 0%, #DB2777 100%)",
      gradient_primary_dark: "linear-gradient(90deg, #60A5FA 0%, #F472B6 100%)",
      gradient_secondary: "linear-gradient(135deg, #DB2777 0%, #F59E0B 100%)",
      gradient_success: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
      gradient_primary: "linear-gradient(90deg, #2563EB 0%, #DB2777 100%)",
    },
  },
  "theme-bubbly": {
    primary_light: "#F43F5E",
    primary_dark: "#FB7185",
    secondary_light: "#0EA5E9",
    secondary_dark: "#38BDF8",
    accent_light: "#A855F7",
    accent_dark: "#C084FC",
    background_default_light: "#FFF1F2",
    background_paper_light: "#FFFFFF",
    background_default_dark: "#1C0A0F",
    background_paper_dark: "#2A1218",
    text_primary_light: "#881337",
    text_secondary_light: "#9F1239",
    text_disabled_light: "#FDA4AF",
    text_primary_dark: "#FFE4E6",
    text_secondary_dark: "#FECDD3",
    text_disabled_dark: "#9F1239",
    divider_light: "#FECDD3",
    divider_dark: "#4C0519",
    border_light: "#FECDD3",
    border_dark: "#881337",
    action_hover_light: "rgba(244,63,94,0.08)",
    action_hover_dark: "rgba(251,113,133,0.12)",
    action_selected_light: "rgba(244,63,94,0.14)",
    action_selected_dark: "rgba(251,113,133,0.18)",
    btnLight: "#F43F5E",
    btnDark: "#FB7185",
    btnTextL: "#FFFFFF",
    btnTextD: "#1C0A0F",
    outBorderL: "#F43F5E",
    outBorderD: "#FB7185",
    outColorL: "#F43F5E",
    outColorD: "#FB7185",
    gradients: {
      gradient_primary_light:
        "linear-gradient(135deg, #F43F5E 0%, #A855F7 50%, #0EA5E9 100%)",
      gradient_primary_dark:
        "linear-gradient(135deg, #FB7185 0%, #C084FC 50%, #38BDF8 100%)",
      gradient_secondary: "linear-gradient(135deg, #0EA5E9 0%, #F43F5E 100%)",
      gradient_success: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
      gradient_primary: "linear-gradient(135deg, #F43F5E 0%, #A855F7 100%)",
    },
  },
  "theme-glass": {
    primary_light: "#6366F1",
    primary_dark: "#A5B4FC",
    secondary_light: "#06B6D4",
    secondary_dark: "#22D3EE",
    accent_light: "#EC4899",
    accent_dark: "#F472B6",
    background_default_light: "#EEF2FF",
    background_paper_light: "rgba(255,255,255,0.72)",
    background_default_dark: "#0A0C18",
    background_paper_dark: "rgba(30,41,59,0.55)",
    text_primary_light: "#1E1B4B",
    text_secondary_light: "#4338CA",
    text_disabled_light: "#A5B4FC",
    text_primary_dark: "#EEF2FF",
    text_secondary_dark: "#C7D2FE",
    text_disabled_dark: "#6366F1",
    divider_light: "rgba(99,102,241,0.2)",
    divider_dark: "rgba(165,180,252,0.2)",
    border_light: "rgba(99,102,241,0.25)",
    border_dark: "rgba(165,180,252,0.25)",
    action_hover_light: "rgba(99,102,241,0.08)",
    action_hover_dark: "rgba(165,180,252,0.12)",
    action_selected_light: "rgba(99,102,241,0.14)",
    action_selected_dark: "rgba(165,180,252,0.18)",
    btnLight: "#6366F1",
    btnDark: "#A5B4FC",
    btnTextL: "#FFFFFF",
    btnTextD: "#0A0C18",
    outBorderL: "#6366F1",
    outBorderD: "#A5B4FC",
    outColorL: "#6366F1",
    outColorD: "#A5B4FC",
    gradients: {
      gradient_primary_light:
        "linear-gradient(135deg, #6366F1 0%, #06B6D4 50%, #EC4899 100%)",
      gradient_primary_dark:
        "linear-gradient(135deg, #A5B4FC 0%, #22D3EE 50%, #F472B6 100%)",
      gradient_secondary: "linear-gradient(135deg, #06B6D4 0%, #6366F1 100%)",
      gradient_success: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
      gradient_primary: "linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)",
    },
  },
  "theme-editorial": {
    primary_light: "#9F1239",
    primary_dark: "#FB7185",
    secondary_light: "#B45309",
    secondary_dark: "#FBBF24",
    accent_light: "#1D4ED8",
    accent_dark: "#60A5FA",
    background_default_light: "#FFFBEB",
    background_paper_light: "#FFF7ED",
    background_default_dark: "#1C0A0A",
    background_paper_dark: "#2A1212",
    text_primary_light: "#4C0519",
    text_secondary_light: "#9F1239",
    text_disabled_light: "#FDA4AF",
    text_primary_dark: "#FFE4E6",
    text_secondary_dark: "#FECDD3",
    text_disabled_dark: "#9F1239",
    divider_light: "#FCD34D",
    divider_dark: "#7F1D1D",
    border_light: "#F59E0B",
    border_dark: "#FBBF24",
    action_hover_light: "rgba(159,18,57,0.06)",
    action_hover_dark: "rgba(251,113,133,0.1)",
    action_selected_light: "rgba(159,18,57,0.12)",
    action_selected_dark: "rgba(251,113,133,0.16)",
    btnLight: "#9F1239",
    btnDark: "#FB7185",
    btnTextL: "#FFFFFF",
    btnTextD: "#1C0A0A",
    outBorderL: "#9F1239",
    outBorderD: "#FB7185",
    outColorL: "#9F1239",
    outColorD: "#FB7185",
    gradients: {
      gradient_primary_light:
        "linear-gradient(135deg, #9F1239 0%, #B45309 50%, #F59E0B 100%)",
      gradient_primary_dark: "linear-gradient(135deg, #FB7185 0%, #FBBF24 100%)",
      gradient_secondary: "linear-gradient(135deg, #B45309 0%, #9F1239 100%)",
      gradient_success: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
      gradient_primary: "linear-gradient(135deg, #9F1239 0%, #B45309 100%)",
    },
  },
  "theme-zen": {
    primary_light: "#0D9488",
    primary_dark: "#2DD4BF",
    secondary_light: "#6366F1",
    secondary_dark: "#A5B4FC",
    accent_light: "#8B5CF6",
    accent_dark: "#C4B5FD",
    background_default_light: "#F0FDFA",
    background_paper_light: "#FFFFFF",
    background_default_dark: "#042F2E",
    background_paper_dark: "#0A3D3A",
    text_primary_light: "#134E4A",
    text_secondary_light: "#0F766E",
    text_disabled_light: "#5EEAD4",
    text_primary_dark: "#CCFBF1",
    text_secondary_dark: "#99F6E4",
    text_disabled_dark: "#0D9488",
    divider_light: "#99F6E4",
    divider_dark: "#115E59",
    border_light: "#5EEAD4",
    border_dark: "#2DD4BF",
    action_hover_light: "rgba(13,148,136,0.06)",
    action_hover_dark: "rgba(45,212,191,0.1)",
    action_selected_light: "rgba(13,148,136,0.12)",
    action_selected_dark: "rgba(45,212,191,0.16)",
    btnLight: "#0D9488",
    btnDark: "#2DD4BF",
    btnTextL: "#FFFFFF",
    btnTextD: "#042F2E",
    outBorderL: "#0D9488",
    outBorderD: "#2DD4BF",
    outColorL: "#0D9488",
    outColorD: "#2DD4BF",
    gradients: {
      gradient_primary_light:
        "linear-gradient(135deg, #0D9488 0%, #6366F1 50%, #8B5CF6 100%)",
      gradient_primary_dark:
        "linear-gradient(135deg, #2DD4BF 0%, #A5B4FC 50%, #C4B5FD 100%)",
      gradient_secondary: "linear-gradient(135deg, #6366F1 0%, #0D9488 100%)",
      gradient_success: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
      gradient_primary: "linear-gradient(135deg, #0D9488 0%, #6366F1 100%)",
    },
  },
};

function applyPalette(obj, p) {
  const keys = [
    "primary_light",
    "primary_dark",
    "secondary_light",
    "secondary_dark",
    "accent_light",
    "accent_dark",
    "background_default_light",
    "background_paper_light",
    "background_default_dark",
    "background_paper_dark",
    "text_primary_light",
    "text_secondary_light",
    "text_disabled_light",
    "text_primary_dark",
    "text_secondary_dark",
    "text_disabled_dark",
    "divider_light",
    "divider_dark",
    "border_light",
    "border_dark",
    "action_hover_light",
    "action_hover_dark",
    "action_selected_light",
    "action_selected_dark",
  ];
  for (const k of keys) if (p[k] != null) obj[k] = p[k];
  Object.assign(obj, p.gradients);

  if (obj.button?.contained) {
    obj.button.contained.backgroundColor_light = p.btnLight;
    obj.button.contained.backgroundColor_dark = p.btnDark;
    obj.button.contained.color_light = p.btnTextL;
    obj.button.contained.color_dark = p.btnTextD;
  }
  if (obj.button?.outlined) {
    obj.button.outlined.borderColor_light = p.outBorderL;
    obj.button.outlined.borderColor_dark = p.outBorderD;
    obj.button.outlined.color_light = p.outColorL;
    obj.button.outlined.color_dark = p.outColorD;
  }
  if (obj.button?.text) {
    obj.button.text.color_light = p.outColorL;
    obj.button.text.color_dark = p.outColorD;
  }

  const bwLight = new Set([
    "#000000",
    "#1A1A1A",
    "#111111",
    "rgba(0, 0, 0, 0.75)",
    "rgba(0, 0, 0, 0.7)",
  ]);
  const bwDarkPrimary = new Set(["#FFFFFF"]);

  function walk(node, parentKey = "") {
    if (!node || typeof node !== "object") return;
    for (const [k, v] of Object.entries(node)) {
      if (v && typeof v === "object") {
        walk(v, k);
        continue;
      }
      if (typeof v !== "string") continue;
      if (
        /backgroundColor_light|itemActiveColor_light/.test(k) &&
        bwLight.has(v)
      ) {
        node[k] = p.btnLight;
      }
      if (
        (k === "itemActiveColor_dark" ||
          (parentKey === "contained" && k === "backgroundColor_dark") ||
          (parentKey === "chip" && k === "backgroundColor_dark")) &&
        bwDarkPrimary.has(v)
      ) {
        node[k] = p.btnDark;
      }
      if (
        parentKey === "contained" &&
        k === "color_dark" &&
        v === "#000000"
      ) {
        node[k] = p.btnTextD;
      }
    }
  }
  walk(obj);

  if (obj.drawer) {
    obj.drawer.itemActiveColor_light = p.primary_light;
    obj.drawer.itemActiveColor_dark = p.primary_dark;
  }
  if (obj.listItemButton) {
    obj.listItemButton.itemActiveColor_light = p.primary_light;
    obj.listItemButton.itemActiveColor_dark = p.primary_dark;
  }

  obj.glass_bg_light = "rgba(255, 255, 255, 0.65)";
  obj.glass_bg_dark = "rgba(15, 23, 42, 0.55)";
  obj.ai_accent_1 = p.primary_light;
  obj.ai_accent_2 = p.secondary_light;
  obj.ai_accent_3 = p.accent_light;
  obj.ai_glow = `0 0 24px ${p.primary_light}55`;
  obj.lastUpdated = new Date().toISOString();
}

for (const [id, palette] of Object.entries(palettes)) {
  const fp = path.join(dir, `${id}.json`);
  if (!fs.existsSync(fp)) {
    console.log("skip missing", id);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(fp, "utf8"));
  applyPalette(data, palette);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
  console.log("updated", id, "→", palette.primary_light);
}

const boost = {
  "theme-sunset": {
    gradient_primary_light:
      "linear-gradient(135deg, #C2410C 0%, #EA580C 40%, #DB2777 100%)",
    gradient_primary_dark:
      "linear-gradient(135deg, #FB923C 0%, #F472B6 50%, #FCD34D 100%)",
    gradient_secondary:
      "linear-gradient(135deg, #9D174D 0%, #C2410C 50%, #D97706 100%)",
    gradient_primary: "linear-gradient(135deg, #C2410C 0%, #DB2777 100%)",
  },
  "theme-forest": {
    gradient_primary_light:
      "linear-gradient(135deg, #065F46 0%, #059669 40%, #0EA5E9 100%)",
    gradient_primary_dark:
      "linear-gradient(135deg, #34D399 0%, #6EE7B7 50%, #38BDF8 100%)",
    gradient_secondary: "linear-gradient(135deg, #047857 0%, #0D9488 100%)",
    gradient_primary: "linear-gradient(135deg, #065F46 0%, #0EA5E9 100%)",
  },
  "theme-violet": {
    gradient_primary_light:
      "linear-gradient(135deg, #6D28D9 0%, #9333EA 40%, #EC4899 100%)",
    gradient_primary_dark:
      "linear-gradient(135deg, #A78BFA 0%, #C4B5FD 50%, #F472B6 100%)",
    gradient_secondary: "linear-gradient(135deg, #5B21B6 0%, #DB2777 100%)",
    gradient_primary: "linear-gradient(135deg, #6D28D9 0%, #EC4899 100%)",
  },
  "theme-cyber": {
    gradient_primary_light:
      "linear-gradient(135deg, #00FF41 0%, #00D4FF 50%, #FF00E5 100%)",
    gradient_primary_dark:
      "linear-gradient(135deg, #00FF41 0%, #00D4FF 50%, #FF00E5 100%)",
    gradient_secondary: "linear-gradient(135deg, #00D4FF 0%, #00FF41 100%)",
    gradient_primary: "linear-gradient(135deg, #00FF41 0%, #00D4FF 100%)",
  },
  "theme-same": {
    gradient_primary_light:
      "linear-gradient(135deg, #4F46E5 0%, #6366F1 40%, #EC4899 100%)",
    gradient_primary_dark:
      "linear-gradient(135deg, #818CF8 0%, #A78BFA 50%, #F472B6 100%)",
    gradient_secondary: "linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",
    gradient_primary: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
  },
  "theme-darkocean": {
    gradient_primary_light:
      "linear-gradient(135deg, #16A34A 0%, #0EA5E9 50%, #2563EB 100%)",
    gradient_primary_dark:
      "linear-gradient(135deg, #22C55E 0%, #38BDF8 50%, #60A5FA 100%)",
    gradient_secondary: "linear-gradient(135deg, #0EA5E9 0%, #16A34A 100%)",
    gradient_primary: "linear-gradient(135deg, #16A34A 0%, #0EA5E9 100%)",
  },
};

for (const [id, g] of Object.entries(boost)) {
  const fp = path.join(dir, `${id}.json`);
  const data = JSON.parse(fs.readFileSync(fp, "utf8"));
  Object.assign(data, g);
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
  console.log("boosted", id);
}

console.log("done");
