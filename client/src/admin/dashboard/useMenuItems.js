import React from "react";
import { useContext } from "react";
import { TranslateContext } from "../../context/TranslateContext"; // adjust path
import {
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  SupportAgent,
  Unsubscribe,
  ContentPaste,
  Translate,
  SmartToyOutlined,
  StoreOutlined,
  PaletteOutlined,
  CloudSync,
  SocialDistance,
} from "@mui/icons-material";

export const useMenuItems = () => {
  const { lang } = useContext(TranslateContext);

  return [
    {
      id: "dashboards",
      text: lang?.dashboards || "Dashboard",
      icon: <DashboardIcon />,
    },
    {
      id: "users",
      text: lang?.users || "Users",
      icon: <GroupIcon />,
    },
    {
      id: "ai-automation",
      text: lang?.aiAutomation || "AI & Automation",
      icon: <SmartToyOutlined />,
      submenu: [
        { id: "ai-provider", text: lang?.aiProvider || "AI Providers" },
        { id: "prompt-template", text: lang?.promptTe || "Prompt Templates" },
        { id: "templates", text: lang?.templates || "Templates" },
        { id: "task-pricing", text: lang?.taskPricing || "Task Pricing" },
      ],
    },
    {
      id: "monetization",
      text: lang?.monetization || "Monetization",
      icon: <StoreOutlined />,
      submenu: [
        { id: "plans", text: lang?.plans || "Plans" },
        {
          id: "credit-packages",
          text: lang?.creditPackages || "Credit Packages",
        },
        {
          id: "payment-gateway",
          text: lang?.paymentGateway || "Payment Gateways",
        },
        { id: "launchpad", text: lang?.launchpad || "Launchpad JV" },
        { id: "orders", text: lang?.orders || "Orders" },
      ],
    },

    {
      id: "setup-social-network",
      text: lang?.socialLoginConfig || "Social Auth",
      icon: <SocialDistance />,
      submenu: [
        {
          id: "instagram-config",
          text: lang?.instaConfig || "Instagram Config",
        },
        {
          id: "tiktok-config",
          text: lang?.tiktokConfig || "Tiktok Config",
        },
      ],
    },

    {
      id: "appearance",
      text: lang?.appearance || "Appearance",
      icon: <PaletteOutlined />,
      submenu: [
        { id: "web-theme", text: lang?.webTheme || "Web Theme" },
        { id: "site-settings", text: lang?.siteSettings || "Site Settings" },
      ],
    },
    {
      id: "content",
      text: lang?.content || "Content",
      icon: <ContentPaste />,
      submenu: [
        { id: "blogs", text: lang?.blogs || "Blogs" },
        { id: "leads", text: lang?.leads || "Leads" },
      ],
    },
    {
      id: "communications",
      text: lang?.communications || "Communications",
      icon: <Unsubscribe />,
      submenu: [
        { id: "email-settings", text: lang?.emailSettings || "Email Settings" },
        {
          id: "email-templates",
          text: lang?.emailTemplates || "Email Templates",
        },
      ],
    },
    {
      id: "localization",
      text: lang?.localization || "Localization",
      icon: <Translate />,
      submenu: [
        {
          id: "web-translation",
          text: lang?.webTranslation || "Web Translation",
        },
      ],
    },
    {
      id: "help",
      text: lang?.help || "Help & Support",
      icon: <SupportAgent />,
    },
    {
      id: "update",
      text: lang?.updateApp || "Update App",
      icon: <CloudSync />,
    },
  ];
};
