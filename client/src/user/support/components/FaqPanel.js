// components/support/FaqPanel.jsx
import React from "react";
import { ExpandMoreOutlined, HelpOutlineOutlined } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

const getFaqItems = (lang) => [
  { question: lang?.faq1Question || "", answer: lang?.faq1Answer || "" },
  { question: lang?.faq2Question || "", answer: lang?.faq2Answer || "" },
  { question: lang?.faq3Question || "", answer: lang?.faq3Answer || "" },
  { question: lang?.faq4Question || "", answer: lang?.faq4Answer || "" },
  { question: lang?.faq5Question || "", answer: lang?.faq5Answer || "" },
  { question: lang?.faq6Question || "", answer: lang?.faq6Answer || "" },
];

const FaqPanel = ({ lang }) => {
  const theme = useTheme();
  const FAQ_ITEMS = getFaqItems(lang);
  const [expandedFaq, setExpandedFaq] = React.useState(null);

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
        position: "sticky",
        top: 16,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HelpOutlineOutlined sx={{ color: "warning.main", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {lang?.faq || "Frequently Asked Questions"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {lang?.faqSub || "Quick answers to common questions"}
            </Typography>
          </Box>
        </Stack>

        {/* Accordion list */}
        <Stack spacing={1}>
          {FAQ_ITEMS.map((faq, index) => (
            <Accordion
              key={index}
              expanded={expandedFaq === index}
              onChange={(_, isExpanded) =>
                setExpandedFaq(isExpanded ? index : null)
              }
              disableGutters
              elevation={0}
              sx={{
                border: `1px solid ${
                  expandedFaq === index
                    ? alpha(theme.palette.primary.main, 0.3)
                    : theme.palette.divider
                }`,
                borderRadius: "10px !important",
                bgcolor:
                  expandedFaq === index
                    ? alpha(theme.palette.primary.main, 0.03)
                    : "transparent",
                transition: "all 0.3s ease",
                "&:before": { display: "none" },
                overflow: "hidden",
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreOutlined
                    sx={{
                      color:
                        expandedFaq === index
                          ? "primary.main"
                          : "text.secondary",
                      fontSize: 20,
                    }}
                  />
                }
                sx={{ px: 2, py: 0.5, minHeight: 52 }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip
                    label={index + 1}
                    size="small"
                    sx={{
                      width: 24,
                      height: 24,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      bgcolor:
                        expandedFaq === index
                          ? alpha(theme.palette.primary.main, 0.12)
                          : alpha(theme.palette.text.secondary, 0.08),
                      color:
                        expandedFaq === index
                          ? "primary.main"
                          : "text.secondary",
                      "& .MuiChip-label": { px: 0 },
                    }}
                  />
                  <Typography
                    variant="body2"
                    fontWeight={expandedFaq === index ? 700 : 500}
                    color={
                      expandedFaq === index ? "primary.main" : "text.primary"
                    }
                    sx={{ transition: "all 0.2s ease" }}
                  >
                    {faq.question}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                <Divider sx={{ mb: 1.5 }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.7, pl: 4.5 }}
                >
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default FaqPanel;
