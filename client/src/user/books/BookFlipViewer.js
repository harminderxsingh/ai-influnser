import React from "react";
import {
  Box,
  IconButton,
  Stack,
  Typography,
  alpha,
  useTheme,
  useMediaQuery,
  keyframes,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  MenuBook,
} from "@mui/icons-material";

const FLIP_MS = 820;

const flipNext = keyframes`
  0% {
    transform: rotateY(0deg) translateZ(0);
    box-shadow: 2px 0 0 ${alpha("#000", 0.06)};
  }
  35% {
    box-shadow: -18px 8px 40px ${alpha("#000", 0.35)};
  }
  100% {
    transform: rotateY(-178deg) translateZ(8px);
    box-shadow: 6px 0 22px ${alpha("#000", 0.18)};
  }
`;

const flipPrev = keyframes`
  0% {
    transform: rotateY(0deg) translateZ(0);
    box-shadow: -2px 0 0 ${alpha("#000", 0.06)};
  }
  35% {
    box-shadow: 18px 8px 40px ${alpha("#000", 0.35)};
  }
  100% {
    transform: rotateY(178deg) translateZ(8px);
    box-shadow: -6px 0 22px ${alpha("#000", 0.18)};
  }
`;

const settleIn = keyframes`
  0% { transform: scale(0.97) rotateY(6deg); opacity: 0.65; }
  100% { transform: scale(1) rotateY(0deg); opacity: 1; }
`;

/**
 * Animated 3D flip-book viewer (AI cover + pages).
 * pages: [{ page, heading, content }]
 * coverImage: media filename or absolute/relative URL
 */
const BookFlipViewer = ({
  title,
  authorName,
  genre,
  pages = [],
  coverImage,
  lang,
  autoIntro = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [index, setIndex] = React.useState(0);
  const [flip, setFlip] = React.useState(null);
  const introDone = React.useRef(false);
  const total = (pages?.length || 0) + 1;

  const coverSrc = React.useMemo(() => {
    if (!coverImage) return null;
    const raw = String(coverImage).trim();
    if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
    if (raw.startsWith("/")) return raw;
    return `/media/${raw}`;
  }, [coverImage]);

  const go = React.useCallback(
    (next) => {
      if (flip) return;
      const clamped = Math.max(0, Math.min(total - 1, next));
      if (clamped === index) return;
      const dir = clamped > index ? "next" : "prev";
      setFlip({ dir, from: index, to: clamped });
      window.setTimeout(() => {
        setIndex(clamped);
        setFlip(null);
      }, FLIP_MS);
    },
    [flip, index, total],
  );

  React.useEffect(() => {
    setIndex(0);
    setFlip(null);
    introDone.current = false;
  }, [title, pages?.length, coverImage]);

  // After book is ready: one intro flip cover → page 1
  React.useEffect(() => {
    if (!autoIntro || introDone.current) return undefined;
    if (!pages?.length) return undefined;
    const t = window.setTimeout(() => {
      if (introDone.current) return;
      introDone.current = true;
      go(1);
    }, 900);
    return () => window.clearTimeout(t);
  }, [autoIntro, pages?.length, go]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  const touchX = React.useRef(null);
  const onTouchStart = (e) => {
    touchX.current = e.changedTouches?.[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const x = e.changedTouches?.[0]?.clientX;
    const dx = x - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) go(index + 1);
    else go(index - 1);
  };

  const sheetHeight = isMobile ? 440 : 540;
  const sheetWidth = isMobile ? "100%" : 380;

  const renderCover = () => (
    <Box
      sx={{
        height: "100%",
        position: "relative",
        overflow: "hidden",
        bgcolor: "#3E2723",
        color: "#FBE9E7",
        backfaceVisibility: "hidden",
      }}
    >
      {coverSrc ? (
        <Box
          component="img"
          src={coverSrc}
          alt={title || "Cover"}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <Box
          sx={{
            height: "100%",
            p: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: `linear-gradient(145deg, ${alpha("#3E2723", 0.95)} 0%, #5D4037 45%, #8D6E63 100%)`,
          }}
        >
          <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 2 }}>
            {genre || lang?.book || "Book"}
          </Typography>
          <Box>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              fontWeight={800}
              sx={{ fontFamily: "Georgia, 'Times New Roman', serif", mb: 1.5 }}
            >
              {title}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {lang?.byAuthor || "by"} {authorName || "Anonymous"}
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" gap={1} sx={{ opacity: 0.75 }}>
            <MenuBook fontSize="small" />
            <Typography variant="caption">
              {pages.length} {lang?.pages || "pages"}
            </Typography>
          </Stack>
        </Box>
      )}

      {/* Soft vignette + title strip for AI covers */}
      {coverSrc && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, ${alpha("#000", 0.15)} 0%, transparent 35%, transparent 55%, ${alpha("#000", 0.55)} 100%)`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            p: 2.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.85 }}
          >
            {genre || lang?.book || "Book"}
          </Typography>
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ fontFamily: "Georgia, 'Times New Roman', serif", lineHeight: 1.25 }}
          >
            {title}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {lang?.byAuthor || "by"} {authorName || "Anonymous"}
          </Typography>
        </Box>
      )}
    </Box>
  );

  const renderPageContent = (pageIndex) => {
    if (pageIndex === 0) return renderCover();
    const currentPage = pages[pageIndex - 1];
    return (
      <Box
        sx={{
          height: "100%",
          p: { xs: 2.5, sm: 3.5 },
          display: "flex",
          flexDirection: "column",
          bgcolor: "#FFFDF8",
          color: "#2C1810",
          backgroundImage: `linear-gradient(${alpha("#D7CCC8", 0.35)} 1px, transparent 1px)`,
          backgroundSize: "100% 1.55rem",
          backfaceVisibility: "hidden",
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            mb: 1.5,
            color: "#5D4037",
          }}
        >
          {currentPage?.heading || `${lang?.page || "Page"} ${pageIndex}`}
        </Typography>
        <Box sx={{ flex: 1, overflow: "auto", pr: 0.5 }}>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.7,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: { xs: "0.92rem", sm: "0.98rem" },
            }}
          >
            {currentPage?.content || ""}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{ mt: 1.5, textAlign: "center", color: "#8D6E63" }}
        >
          {pageIndex} / {pages.length}
        </Typography>
      </Box>
    );
  };

  const displayIndex = flip ? flip.from : index;
  const underIndex = flip ? flip.to : index;

  return (
    <Box sx={{ width: "100%", maxWidth: 480, mx: "auto" }}>
      <Box
        sx={{
          perspective: "1800px",
          width: sheetWidth,
          maxWidth: "100%",
          mx: "auto",
          userSelect: "none",
          animation: `${settleIn} 0.7s ease-out both`,
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Box
          sx={{
            position: "relative",
            height: sheetHeight,
            borderRadius: "6px 14px 14px 6px",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Book thickness / spine */}
          <Box
            sx={{
              position: "absolute",
              left: -10,
              top: 10,
              bottom: 10,
              width: 10,
              borderRadius: "4px 0 0 4px",
              background: `linear-gradient(90deg, #4E342E, #6D4C41)`,
              boxShadow: `inset -2px 0 4px ${alpha("#000", 0.35)}`,
              zIndex: 0,
            }}
          />

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "6px 14px 14px 6px",
              boxShadow: `0 26px 60px ${alpha("#000", 0.35)}`,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Under page */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "6px 14px 14px 6px",
              overflow: "hidden",
              border: `1px solid ${alpha("#5D4037", 0.35)}`,
              bgcolor: "#FFFDF8",
              zIndex: 1,
            }}
          >
            {renderPageContent(underIndex)}
          </Box>

          {flip && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "6px 14px 14px 6px",
                overflow: "hidden",
                border: `1px solid ${alpha("#5D4037", 0.35)}`,
                bgcolor: "#FFFDF8",
                zIndex: 3,
                transformStyle: "preserve-3d",
                transformOrigin:
                  flip.dir === "next" ? "left center" : "right center",
                animation: `${flip.dir === "next" ? flipNext : flipPrev} ${FLIP_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards`,
                "@media (prefers-reduced-motion: reduce)": {
                  animation: "none",
                  opacity: 0,
                },
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                {renderPageContent(displayIndex)}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                      flip.dir === "next"
                        ? `linear-gradient(90deg, ${alpha("#000", 0.18)} 0%, transparent 22%, ${alpha("#fff", 0.12)} 100%)`
                        : `linear-gradient(270deg, ${alpha("#000", 0.18)} 0%, transparent 22%, ${alpha("#fff", 0.12)} 100%)`,
                  }}
                />
              </Box>
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform:
                    flip.dir === "next" ? "rotateY(180deg)" : "rotateY(-180deg)",
                  background: `linear-gradient(135deg, #EFEBE9 0%, #D7CCC8 50%, #A1887F 100%)`,
                }}
              />
            </Box>
          )}

          {!flip && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "6px 14px 14px 6px",
                overflow: "hidden",
                border: `1px solid ${alpha("#5D4037", 0.35)}`,
                bgcolor: "#FFFDF8",
                zIndex: 2,
                cursor: "pointer",
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mid = rect.left + rect.width / 2;
                if (e.clientX >= mid) go(index + 1);
                else go(index - 1);
              }}
            >
              {renderPageContent(index)}
            </Box>
          )}
        </Box>
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={2}
        mt={2}
      >
        <IconButton
          onClick={() => go(index - 1)}
          disabled={index <= 0 || !!flip}
          aria-label="Previous page"
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.16) },
          }}
        >
          <ChevronLeft />
        </IconButton>
        <Typography
          variant="body2"
          color="text.secondary"
          minWidth={90}
          textAlign="center"
        >
          {index === 0
            ? lang?.cover || "Cover"
            : `${lang?.page || "Page"} ${index}`}
        </Typography>
        <IconButton
          onClick={() => go(index + 1)}
          disabled={index >= total - 1 || !!flip}
          aria-label="Next page"
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.16) },
          }}
        >
          <ChevronRight />
        </IconButton>
      </Stack>
      <Typography
        variant="caption"
        color="text.disabled"
        display="block"
        textAlign="center"
        mt={0.5}
      >
        {lang?.tapToTurn || "Swipe, tap sides, or use arrows to turn pages"}
      </Typography>
    </Box>
  );
};

export default BookFlipViewer;
