/**
 * Panel chrome per Web Theme — unique shell UI, not just palette swap.
 * Variant is derived from theme id (or config.layout.variant).
 */

const VARIANT_BY_ID = {
  default: "default",
  "theme-sunset": "warm",
  "theme-forest": "nature",
  "theme-violet": "luxe",
  "theme-sharp": "sharp",
  "theme-bubbly": "bubbly",
  "theme-glass": "glass",
  "theme-editorial": "editorial",
  "theme-cyber": "cyber",
  "theme-zen": "zen",
  "theme-same": "fresh",
  "theme-darkocean": "ocean",
};

const FONT_LINKS = {
  Inter:
    "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
  Nunito:
    "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap",
  Poppins:
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
  "Playfair Display":
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap",
  "JetBrains Mono":
    "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap",
  "DM Sans":
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
  "IBM Plex Mono":
    "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap",
};

export function resolvePanelVariant(themeId, config = {}) {
  if (config?.layout?.variant) return config.layout.variant;
  return VARIANT_BY_ID[themeId] || "default";
}

export function resolveDrawerWidth(themeId, config = {}, fallback = 240) {
  const fromLayout = config?.layout?.sidebar?.width;
  const fromDrawer = config?.drawer?.width;
  if (fromLayout) return Number(fromLayout);
  if (fromDrawer) return Number(fromDrawer);
  const variant = resolvePanelVariant(themeId, config);
  const widths = {
    bubbly: 268,
    editorial: 200,
    zen: 208,
    sharp: 240,
    glass: 248,
    cyber: 236,
    default: fallback,
  };
  return widths[variant] || fallback;
}

export function extractPrimaryFont(fontFamily) {
  if (!fontFamily) return "Inter";
  const first = String(fontFamily).split(",")[0].trim().replace(/['"]/g, "");
  return first || "Inter";
}

export function ensureThemeFontLoaded(fontFamily) {
  if (typeof document === "undefined") return;
  const name = extractPrimaryFont(fontFamily);
  const href = FONT_LINKS[name];
  if (!href) return;
  const id = `theme-font-${name.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * @returns panel chrome style objects for shell components
 */
export function buildPanelChrome({
  themeId,
  config,
  muiTheme,
  mode,
  fallbackDrawerWidth = 240,
}) {
  const variant = resolvePanelVariant(themeId, config);
  const drawerWidth = resolveDrawerWidth(themeId, config, fallbackDrawerWidth);
  const primary = muiTheme.palette.primary.main;
  const paper = muiTheme.palette.background.paper;
  const bg = muiTheme.palette.background.default;
  const divider = muiTheme.palette.divider;
  const text = muiTheme.palette.text.primary;
  const isDark = mode === "dark";
  const glassBlur = config?.glass_blur || "16px";
  const cardRadius = config?.card?.borderRadius ?? 12;
  const btnRadius = config?.button?.borderRadius ?? 8;

  const base = {
    variant,
    drawerWidth,
    fontFamily: config?.font_family || muiTheme.typography?.fontFamily,
    shellSx: {
      minHeight: "100vh",
      backgroundColor: bg,
      fontFamily: config?.font_family || undefined,
    },
    contentSx: {
      p: { xs: 2, sm: 3 },
    },
    mainSx: {},
  };

  const presets = {
    default: () => ({
      ...base,
      sidebarPaperSx: {
        borderRight: `1px solid ${divider}`,
        backgroundColor: bg,
      },
      sidebarInnerSx: { backgroundColor: bg },
      brandSx: {},
      searchSx: { borderRadius: 2 },
      navItemSx: (active) => ({
        borderRadius: 1.5,
        ...(active
          ? {
              backgroundColor: `${primary}18`,
              color: primary,
            }
          : {}),
      }),
      topBarSx: {},
      pageHeaderSx: {
        borderRadius: `${cardRadius}px`,
        border: `1px solid ${divider}`,
        backgroundImage: "none",
      },
      pageHeaderIconSx: {
        borderRadius: `${Math.min(cardRadius, 14)}px`,
        background: `${primary}14`,
        color: primary,
      },
    }),

    warm: () => ({
      ...base,
      shellSx: {
        ...base.shellSx,
        backgroundImage: isDark
          ? `radial-gradient(1200px 500px at 10% -10%, ${primary}22, transparent 55%)`
          : `radial-gradient(1000px 420px at 0% 0%, ${primary}18, transparent 50%)`,
      },
      sidebarPaperSx: {
        borderRight: "none",
        background: isDark
          ? `linear-gradient(180deg, ${primary}18 0%, ${bg} 40%)`
          : `linear-gradient(180deg, ${primary}12 0%, ${bg} 45%)`,
        boxShadow: `4px 0 24px ${primary}14`,
      },
      sidebarInnerSx: { background: "transparent" },
      brandSx: {
        borderBottom: `1px solid ${primary}33`,
      },
      searchSx: {
        borderRadius: 3,
        border: `1px solid ${primary}40`,
      },
      navItemSx: (active) => ({
        borderRadius: 2.5,
        ...(active
          ? {
              background: `linear-gradient(90deg, ${primary} 0%, ${muiTheme.palette.secondary.main} 100%)`,
              color: muiTheme.palette.primary.contrastText || "#fff",
              boxShadow: `0 8px 20px ${primary}40`,
              "& .MuiListItemIcon-root": {
                color: "inherit !important",
              },
            }
          : {}),
      }),
      topBarSx: {
        borderBottom: `1px solid ${primary}22`,
        background: isDark ? `${paper}cc` : `${paper}ee`,
        backdropFilter: "blur(10px)",
        borderRadius: { md: `0 0 ${cardRadius}px ${cardRadius}px` },
        mx: { md: 2 },
        mt: { md: 1 },
        px: { md: 2 },
        py: { md: 1.5 },
      },
      pageHeaderSx: {
        borderRadius: `${cardRadius}px`,
        border: "none",
        background: `linear-gradient(135deg, ${primary}18 0%, ${muiTheme.palette.secondary.main}14 100%)`,
      },
      pageHeaderIconSx: {
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${primary}, ${muiTheme.palette.secondary.main})`,
        color: "#fff",
      },
    }),

    nature: () => ({
      ...base,
      shellSx: {
        ...base.shellSx,
        backgroundImage: isDark
          ? `linear-gradient(180deg, ${primary}10 0%, ${bg} 30%)`
          : `linear-gradient(180deg, ${primary}0d 0%, ${bg} 28%)`,
      },
      sidebarPaperSx: {
        borderRight: `2px solid ${primary}55`,
        backgroundColor: paper,
      },
      sidebarInnerSx: {
        backgroundColor: paper,
        borderLeft: `4px solid ${primary}`,
      },
      brandSx: {},
      searchSx: { borderRadius: 1, border: `1px solid ${primary}33` },
      navItemSx: (active) => ({
        borderRadius: 1,
        borderLeft: active ? `3px solid ${primary}` : "3px solid transparent",
        ...(active
          ? {
              backgroundColor: `${primary}14`,
              color: primary,
              fontWeight: 700,
            }
          : {}),
      }),
      topBarSx: {
        borderBottom: `2px solid ${primary}33`,
      },
      pageHeaderSx: {
        borderRadius: 1,
        border: `1px solid ${primary}33`,
        borderLeft: `4px solid ${primary}`,
        backgroundImage: "none",
      },
      pageHeaderIconSx: {
        borderRadius: 1,
        background: `${primary}18`,
        color: primary,
      },
    }),

    luxe: () => ({
      ...base,
      shellSx: {
        ...base.shellSx,
        backgroundImage: `radial-gradient(circle at 90% 10%, ${primary}20, transparent 40%)`,
      },
      sidebarPaperSx: {
        borderRight: "none",
        background: isDark
          ? `linear-gradient(195deg, ${primary}30 0%, ${bg} 50%)`
          : `linear-gradient(195deg, ${primary}18 0%, ${paper} 55%)`,
      },
      sidebarInnerSx: { background: "transparent" },
      brandSx: { letterSpacing: "0.04em" },
      searchSx: {
        borderRadius: 999,
        border: `1px solid ${primary}40`,
      },
      navItemSx: (active) => ({
        borderRadius: 999,
        px: 2.2,
        ...(active
          ? {
              backgroundColor: primary,
              color: muiTheme.palette.primary.contrastText || "#fff",
              boxShadow: `0 0 0 4px ${primary}22`,
              "& .MuiListItemIcon-root": { color: "inherit !important" },
            }
          : {}),
      }),
      topBarSx: {
        background: `linear-gradient(90deg, transparent, ${primary}10, transparent)`,
      },
      pageHeaderSx: {
        borderRadius: `${cardRadius + 4}px`,
        border: `1px solid ${primary}30`,
        boxShadow: `0 12px 40px ${primary}18`,
        backgroundImage: "none",
      },
      pageHeaderIconSx: {
        borderRadius: "50%",
        background: primary,
        color: "#fff",
        boxShadow: `0 8px 24px ${primary}55`,
      },
    }),

    sharp: () => ({
      ...base,
      shellSx: {
        ...base.shellSx,
        backgroundImage: isDark
          ? `linear-gradient(135deg, ${primary}18 0%, transparent 40%), repeating-linear-gradient(0deg, transparent, transparent 23px, ${primary}10 24px)`
          : `linear-gradient(135deg, ${primary}12 0%, transparent 45%), repeating-linear-gradient(0deg, transparent, transparent 23px, ${primary}08 24px)`,
      },
      sidebarPaperSx: {
        borderRight: `2px solid ${primary}`,
        backgroundColor: isDark ? muiTheme.palette.background.default : "#fff",
      },
      sidebarInnerSx: { backgroundColor: "inherit" },
      brandSx: {
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        borderBottom: `2px solid ${primary}`,
        color: primary,
      },
      searchSx: {
        borderRadius: 0,
        border: `2px solid ${primary}`,
      },
      navItemSx: (active) => ({
        borderRadius: 0,
        border: `1px solid ${active ? primary : "transparent"}`,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        ...(active
          ? {
              background: `linear-gradient(90deg, ${primary}, ${muiTheme.palette.secondary.main})`,
              color: "#fff",
              "& .MuiListItemIcon-root": { color: "inherit !important" },
            }
          : {}),
      }),
      topBarSx: {
        borderBottom: `2px solid ${primary}`,
        borderRadius: 0,
      },
      pageHeaderSx: {
        borderRadius: 0,
        border: `2px solid ${primary}`,
        backgroundImage: `linear-gradient(90deg, ${primary}18, ${muiTheme.palette.secondary.main}12)`,
      },
      pageHeaderIconSx: {
        borderRadius: 0,
        background: `linear-gradient(135deg, ${primary}, ${muiTheme.palette.secondary.main})`,
        color: "#fff",
      },
      contentSx: { p: { xs: 1.5, sm: 2 } },
    }),

    bubbly: () => ({
      ...base,
      shellSx: {
        ...base.shellSx,
        backgroundImage: isDark
          ? `radial-gradient(circle at 20% 20%, ${primary}15, transparent 35%), radial-gradient(circle at 80% 0%, ${primary}10, transparent 30%)`
          : `radial-gradient(circle at 15% 10%, ${primary}12, transparent 35%)`,
      },
      sidebarPaperSx: {
        border: "none",
        background: "transparent",
        m: 1.5,
        height: "calc(100% - 24px) !important",
        borderRadius: `${Math.max(cardRadius, 24)}px`,
        boxShadow: isDark
          ? "0 20px 50px rgba(0,0,0,0.45)"
          : "0 16px 40px rgba(0,0,0,0.08)",
        overflow: "hidden",
      },
      sidebarInnerSx: {
        backgroundColor: paper,
        borderRadius: `${Math.max(cardRadius, 24)}px`,
      },
      brandSx: {},
      searchSx: {
        borderRadius: 999,
        border: `1px solid ${divider}`,
      },
      navItemSx: (active) => ({
        borderRadius: 999,
        ...(active
          ? {
              backgroundColor: `${primary}18`,
              color: primary,
              transform: "scale(1.02)",
            }
          : {}),
      }),
      topBarSx: {
        mx: 2,
        mt: 1.5,
        px: 2,
        py: 1.2,
        borderRadius: 999,
        backgroundColor: paper,
        boxShadow: isDark
          ? "0 8px 30px rgba(0,0,0,0.35)"
          : "0 8px 24px rgba(0,0,0,0.06)",
      },
      pageHeaderSx: {
        borderRadius: `${Math.max(cardRadius, 28)}px`,
        border: "none",
        boxShadow: isDark
          ? "0 12px 36px rgba(0,0,0,0.35)"
          : "0 12px 32px rgba(0,0,0,0.06)",
        backgroundImage: "none",
      },
      pageHeaderIconSx: {
        borderRadius: "50%",
        background: `${primary}18`,
        color: primary,
      },
      mainSx: {
        width: {
          xs: "100%",
          md: `calc(100% - ${drawerWidth + 24}px)`,
        },
      },
    }),

    glass: () => ({
      ...base,
      shellSx: {
        ...base.shellSx,
        backgroundImage: isDark
          ? `linear-gradient(135deg, #0A0C10 0%, #121826 50%, #0A0C10 100%)`
          : `linear-gradient(135deg, #E8ECF0 0%, #F4F7FB 50%, #E4E9F0 100%)`,
      },
      sidebarPaperSx: {
        borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
        background: isDark
          ? "rgba(20,24,32,0.55)"
          : "rgba(255,255,255,0.55)",
        backdropFilter: `blur(${glassBlur})`,
        WebkitBackdropFilter: `blur(${glassBlur})`,
      },
      sidebarInnerSx: { background: "transparent" },
      brandSx: {},
      searchSx: {
        borderRadius: 3,
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
      },
      navItemSx: (active) => ({
        borderRadius: 2.5,
        ...(active
          ? {
              background: isDark
                ? "rgba(255,255,255,0.12)"
                : "rgba(255,255,255,0.85)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.06)"}`,
              color: primary,
            }
          : {}),
      }),
      topBarSx: {
        mx: 2,
        mt: 1.5,
        px: 2,
        py: 1.2,
        borderRadius: 3,
        background: isDark
          ? "rgba(20,24,32,0.45)"
          : "rgba(255,255,255,0.55)",
        backdropFilter: `blur(${glassBlur})`,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}`,
      },
      pageHeaderSx: {
        borderRadius: `${Math.max(cardRadius, 18)}px`,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
        background: isDark
          ? "rgba(20,24,32,0.4)"
          : "rgba(255,255,255,0.55)",
        backdropFilter: `blur(${glassBlur})`,
        backgroundImage: "none",
      },
      pageHeaderIconSx: {
        borderRadius: 3,
        background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
        color: primary,
      },
    }),

    editorial: () => ({
      ...base,
      shellSx: {
        ...base.shellSx,
        backgroundColor: isDark ? "#0F0E0C" : "#F5F0E8",
      },
      sidebarPaperSx: {
        borderRight: `1px solid ${isDark ? "#3A352C" : "#D4C9B0"}`,
        backgroundColor: isDark ? "#14120F" : "#F5F0E8",
      },
      sidebarInnerSx: { backgroundColor: "inherit" },
      brandSx: {
        fontFamily: '"Playfair Display", Georgia, serif',
        borderBottom: `1px solid ${isDark ? "#3A352C" : "#D4C9B0"}`,
      },
      searchSx: {
        borderRadius: 0,
        border: "none",
        borderBottom: `1px solid ${isDark ? "#3A352C" : "#D4C9B0"}`,
        backgroundColor: "transparent",
      },
      navItemSx: (active) => ({
        borderRadius: 0,
        borderBottom: `1px solid ${isDark ? "#2A261F" : "#E8E0D0"}`,
        ...(active
          ? {
              backgroundColor: "transparent",
              color: text,
              fontWeight: 700,
              boxShadow: `inset 3px 0 0 ${text}`,
            }
          : {}),
      }),
      topBarSx: {
        borderBottom: `1px solid ${isDark ? "#3A352C" : "#D4C9B0"}`,
        pb: 1.5,
      },
      pageHeaderSx: {
        borderRadius: 0,
        border: "none",
        borderBottom: `2px solid ${text}`,
        backgroundImage: "none",
        backgroundColor: "transparent",
        px: 0,
      },
      pageHeaderIconSx: {
        borderRadius: 0,
        border: `1px solid ${text}`,
        background: "transparent",
        color: text,
      },
      contentSx: { p: { xs: 2, sm: 4 }, maxWidth: 1100 },
    }),

    cyber: () => ({
      ...base,
      shellSx: {
        ...base.shellSx,
        backgroundColor: "#050505",
        backgroundImage: `
          linear-gradient(${primary}08 1px, transparent 1px),
          linear-gradient(90deg, ${primary}08 1px, transparent 1px)
        `,
        backgroundSize: "28px 28px",
      },
      sidebarPaperSx: {
        borderRight: `1px solid ${primary}55`,
        backgroundColor: "#000",
        boxShadow: `inset -1px 0 20px ${primary}22`,
      },
      sidebarInnerSx: { backgroundColor: "#000" },
      brandSx: {
        fontFamily: '"JetBrains Mono", monospace',
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        color: primary,
        borderBottom: `1px solid ${primary}44`,
        textShadow: `0 0 12px ${primary}88`,
      },
      searchSx: {
        borderRadius: 0.5,
        border: `1px solid ${primary}55`,
        backgroundColor: "#0A0A0A",
        boxShadow: `0 0 12px ${primary}22`,
      },
      navItemSx: (active) => ({
        borderRadius: 0.5,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 12,
        ...(active
          ? {
              backgroundColor: `${primary}18`,
              color: primary,
              border: `1px solid ${primary}`,
              boxShadow: `0 0 16px ${primary}44`,
              textShadow: `0 0 8px ${primary}`,
              "& .MuiListItemIcon-root": { color: `${primary} !important` },
            }
          : {
              color: "#9CA3AF",
            }),
      }),
      topBarSx: {
        borderBottom: `1px solid ${primary}44`,
        backgroundColor: "#000000cc",
        boxShadow: `0 0 20px ${primary}18`,
      },
      pageHeaderSx: {
        borderRadius: 0.5,
        border: `1px solid ${primary}55`,
        backgroundColor: "#000",
        boxShadow: `0 0 24px ${primary}22`,
        backgroundImage: "none",
      },
      pageHeaderIconSx: {
        borderRadius: 0.5,
        border: `1px solid ${primary}`,
        background: `${primary}18`,
        color: primary,
        boxShadow: `0 0 16px ${primary}55`,
      },
    }),

    zen: () => ({
      ...base,
      shellSx: {
        ...base.shellSx,
        backgroundColor: isDark ? "#0A0A0A" : "#FAFAFA",
      },
      sidebarPaperSx: {
        borderRight: `1px solid ${isDark ? "#1F1F1F" : "#EAEAEA"}`,
        backgroundColor: isDark ? "#0A0A0A" : "#FAFAFA",
      },
      sidebarInnerSx: { backgroundColor: "inherit" },
      brandSx: {
        borderBottom: "none",
        opacity: 0.9,
      },
      searchSx: {
        borderRadius: 1,
        border: `1px solid ${isDark ? "#222" : "#E8E8E8"}`,
        backgroundColor: "transparent",
      },
      navItemSx: (active) => ({
        borderRadius: 1,
        py: 1.4,
        ...(active
          ? {
              backgroundColor: "transparent",
              color: text,
              fontWeight: 600,
              boxShadow: `inset 2px 0 0 ${text}`,
            }
          : {
              color: muiTheme.palette.text.secondary,
            }),
      }),
      topBarSx: {
        borderBottom: "none",
        opacity: 0.95,
      },
      pageHeaderSx: {
        borderRadius: 1,
        border: "none",
        backgroundColor: "transparent",
        backgroundImage: "none",
        px: 0,
        mb: 4,
      },
      pageHeaderIconSx: {
        borderRadius: 1,
        background: "transparent",
        border: `1px solid ${divider}`,
        color: text,
      },
      contentSx: { p: { xs: 3, sm: 5 }, maxWidth: 1040 },
    }),

    fresh: () => ({
      ...base,
      shellSx: {
        ...base.shellSx,
        backgroundImage: isDark
          ? `radial-gradient(800px 300px at 100% 0%, ${muiTheme.palette.secondary.main}22, transparent 50%)`
          : `radial-gradient(800px 300px at 100% 0%, ${muiTheme.palette.secondary.main}14, transparent 50%)`,
      },
      sidebarPaperSx: {
        borderRight: "none",
        m: 1.25,
        height: "calc(100% - 20px) !important",
        borderRadius: `${cardRadius}px`,
        backgroundColor: paper,
        boxShadow: isDark
          ? "0 10px 40px rgba(0,0,0,0.35)"
          : "0 10px 30px rgba(15,23,42,0.06)",
        overflow: "hidden",
      },
      sidebarInnerSx: { backgroundColor: paper },
      brandSx: {},
      searchSx: { borderRadius: `${btnRadius}px` },
      navItemSx: (active) => ({
        borderRadius: `${btnRadius}px`,
        ...(active
          ? {
              background: `linear-gradient(135deg, ${primary}, ${muiTheme.palette.secondary.main})`,
              color: "#fff",
              "& .MuiListItemIcon-root": { color: "inherit !important" },
            }
          : {}),
      }),
      topBarSx: {
        mx: 1.5,
        mt: 1.25,
        px: 2,
        py: 1.25,
        borderRadius: `${cardRadius}px`,
        backgroundColor: paper,
        boxShadow: isDark
          ? "0 8px 24px rgba(0,0,0,0.3)"
          : "0 8px 24px rgba(15,23,42,0.05)",
      },
      pageHeaderSx: {
        borderRadius: `${cardRadius}px`,
        border: "none",
        background: paper,
        boxShadow: isDark
          ? "0 8px 28px rgba(0,0,0,0.3)"
          : "0 8px 28px rgba(15,23,42,0.05)",
        backgroundImage: "none",
      },
      pageHeaderIconSx: {
        borderRadius: `${btnRadius}px`,
        background: `linear-gradient(135deg, ${primary}, ${muiTheme.palette.secondary.main})`,
        color: "#fff",
      },
      mainSx: {
        width: {
          xs: "100%",
          md: `calc(100% - ${drawerWidth + 20}px)`,
        },
      },
    }),

    ocean: () => ({
      ...base,
      shellSx: {
        ...base.shellSx,
        backgroundImage: isDark
          ? `linear-gradient(180deg, #001018 0%, ${bg} 40%), radial-gradient(600px 280px at 50% 0%, ${primary}33, transparent 60%)`
          : `linear-gradient(180deg, ${primary}10 0%, ${bg} 35%)`,
      },
      sidebarPaperSx: {
        borderRight: "none",
        background: isDark
          ? `linear-gradient(180deg, #022c22 0%, #000 70%)`
          : `linear-gradient(180deg, ${primary}18 0%, ${paper} 55%)`,
      },
      sidebarInnerSx: { background: "transparent" },
      brandSx: { borderBottom: `1px solid ${primary}33` },
      searchSx: {
        borderRadius: 2,
        border: `1px solid ${primary}40`,
      },
      navItemSx: (active) => ({
        borderRadius: 2,
        ...(active
          ? {
              backgroundColor: primary,
              color: "#fff",
              boxShadow: `0 10px 24px ${primary}44`,
              "& .MuiListItemIcon-root": { color: "inherit !important" },
            }
          : {}),
      }),
      topBarSx: {
        borderBottom: `1px solid ${primary}22`,
      },
      pageHeaderSx: {
        borderRadius: `${cardRadius}px`,
        border: "none",
        background: `linear-gradient(120deg, ${primary}22, transparent 60%)`,
        backgroundImage: `linear-gradient(120deg, ${primary}20, ${paper})`,
      },
      pageHeaderIconSx: {
        borderRadius: 2,
        background: primary,
        color: "#fff",
      },
    }),
  };

  const build = presets[variant] || presets.default;
  return build();
}
