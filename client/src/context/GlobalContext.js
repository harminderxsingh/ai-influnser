import axios from "axios";
import React, { createContext, useContext, useState, useCallback } from "react";
import { useHistory } from "react-router-dom";

const GlobalContext = createContext(null);

// Custom hook for using the context
export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobal must be used within a GlobalProvider");
  }
  return context;
};

export const GlobalProvider = ({ children }) => {
  const API_BASE_URL = process.env.REACT_APP_BASE_URL;
  const TOKEN_PREFIX = process.env.REACT_APP_TOKEN;
  const history = useHistory();
  const publicWebCacheRef = React.useRef(null);
  const publicWebPromiseRef = React.useRef(null);
  const activeLoadingRequestsRef = React.useRef(0);

  const [data, setData] = useState({
    loading: false,
    snack: false,
    snack_msg: "",
    snack_success: false,
    campaign_done: false,
    tutorial: {},
    userData: {},
    themeData: null,
  });

  // Enhanced snackbar function
  const showSnack = useCallback((message, success = true) => {
    setData((prev) => ({
      ...prev,
      snack: true,
      snack_msg: message,
      snack_success: success,
    }));

    setTimeout(() => {
      setData((prev) => ({
        ...prev,
        snack: false,
        snack_msg: "",
      }));
    }, 4000);
  }, []);

  // Set loading state
  const setLoading = useCallback((loading) => {
    if (!loading) {
      activeLoadingRequestsRef.current = 0;
    }
    setData((prev) => ({ ...prev, loading }));
  }, []);

  const beginGlobalLoading = useCallback(() => {
    activeLoadingRequestsRef.current += 1;
    setData((prev) => (prev.loading ? prev : { ...prev, loading: true }));
  }, []);

  const endGlobalLoading = useCallback(() => {
    activeLoadingRequestsRef.current = Math.max(
      0,
      activeLoadingRequestsRef.current - 1,
    );
    if (activeLoadingRequestsRef.current === 0) {
      setData((prev) => (prev.loading ? { ...prev, loading: false } : prev));
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(
    (admin = false) => {
      try {
        if (admin) {
          localStorage.removeItem(`${TOKEN_PREFIX}_admin`);
          history.push("/admin");
        } else {
          localStorage.removeItem(`${TOKEN_PREFIX}_user`);
          history.push("/user");
        }
      } catch (error) {
        console.error("Error during logout:", error);
      }
    },
    [TOKEN_PREFIX, history],
  );

  // Enhanced axios function
  const hitAxios = useCallback(
    async ({
      path,
      obj = {},
      admin = false,
      post = false,
      showLoading = true,
      showSnackbar = true,
      timeout = 60000,
      headers: customHeaders = {},
      onUploadProgress, // Add this
    }) => {
      const isPublicWebRequest = !post && path === "/api/web/get_web_public";
      if (isPublicWebRequest && publicWebCacheRef.current) {
        return publicWebCacheRef.current;
      }
      if (isPublicWebRequest && publicWebPromiseRef.current) {
        return publicWebPromiseRef.current;
      }

      const token = localStorage.getItem(
        admin ? `${TOKEN_PREFIX}_admin` : `${TOKEN_PREFIX}_user`,
      );

      const shouldShowLoading = showLoading && !isPublicWebRequest;

      if (shouldShowLoading) {
        beginGlobalLoading();
      }

      try {
        const httpMethod = post ? "POST" : "GET";
        const isFormData = obj instanceof FormData;

        const headers = {
          Authorization: token ? `Bearer ${token}` : undefined,
          ...customHeaders,
        };

        if (!isFormData && !headers["Content-Type"]) {
          headers["Content-Type"] = "application/json";
        }

        const config = {
          method: httpMethod,
          url: `${API_BASE_URL}${path}`,
          headers,
          timeout,
          onUploadProgress, // Add this
        };

        if (post) {
          config.data = obj;
        }

        const requestPromise = axios(config);
        if (isPublicWebRequest) {
          publicWebPromiseRef.current = requestPromise.catch((error) => ({
            success: false,
            data: {
              success: false,
              msg: error?.message || "Request failed",
              error: error?.message || "Request failed",
            },
          }));
        }

        const response = await requestPromise;

        if (isPublicWebRequest && response?.data?.success) {
          publicWebCacheRef.current = response;
        }
        if (post && path === "/api/web/save_web_public" && response?.data?.success) {
          publicWebCacheRef.current = null;
        }
        if (isPublicWebRequest) {
          publicWebPromiseRef.current = null;
        }

        if (shouldShowLoading) {
          endGlobalLoading();
        }

        if (response?.data?.logout) {
          handleLogout(admin);
          if (showSnackbar) {
            showSnack("Session expired. Please login again.", false);
          }
          return { ...response, success: false, logout: true };
        }

        if (!admin && response?.data?.emailVerificationRequired) {
          localStorage.removeItem(`${TOKEN_PREFIX}_user`);
          const emailParam = response.data.email
            ? `?email=${encodeURIComponent(response.data.email)}`
            : "";
          history.push(`/verify-email${emailParam}`);
          if (showSnackbar && response.data.msg) {
            showSnack(response.data.msg, Boolean(response.data.success));
          }
          return { ...response, success: false };
        }

        if (showSnackbar) {
          if (!response?.data?.success && response?.data?.msg) {
            showSnack(response.data.msg, false);
          } else if (response?.data?.success && response.data.msg) {
            showSnack(response.data.msg, true);
          }
        }

        return response;
      } catch (error) {
        console.error("API Error:", error);

        if (isPublicWebRequest) {
          publicWebPromiseRef.current = null;
        }

        if (shouldShowLoading) {
          endGlobalLoading();
        }

        if (error.code === "ECONNABORTED") {
          const data = {
            success: false,
            msg: "Request timed out. Please try again.",
            error: "Request timed out",
          };
          if (showSnackbar) {
            showSnack(data.msg, false);
          }
          return { success: false, error: data.error, data };
        } else if (error.message?.includes("Network Error")) {
          const data = {
            success: false,
            msg: "Network error. Please check your internet connection.",
            error: "Network error",
          };
          if (showSnackbar) {
            showSnack(data.msg, false);
          }
          return { success: false, error: data.error, data };
        } else if (error.response?.status === 401) {
          handleLogout(admin);
          const data = {
            success: false,
            msg: "Session expired. Please login again.",
            logout: true,
          };
          if (showSnackbar) {
            showSnack(data.msg, false);
          }
          return { success: false, logout: true, data };
        }

        const errorMessage =
          error.response?.data?.msg || error.message || "An error occurred";

        if (showSnackbar) {
          showSnack(errorMessage, false);
        }

        return {
          success: false,
          error: errorMessage,
          data: {
            success: false,
            msg: errorMessage,
            error: errorMessage,
          },
          response: error.response,
        };
      }
    },
    [
      API_BASE_URL,
      TOKEN_PREFIX,
      beginGlobalLoading,
      endGlobalLoading,
      handleLogout,
      showSnack,
      history,
    ],
  );

  const themeAPI = React.useMemo(
    () => ({
      listThemes: async () => {
        return await hitAxios({
          path: "/api/theme/list-themes",
          post: false,
          showLoading: false,
        });
      },

      getActiveTheme: async () => {
        const resp = await hitAxios({
          path: "/api/theme/active-theme",
          post: false,
          showLoading: false,
        });
        if (resp?.data?.success) {
          setData((prev) => ({
            ...prev,
            themeData: resp?.data?.data?.themeData,
          }));
        }
        return resp;
      },

      getThemeById: async (id) => {
        return await hitAxios({
          path: `/api/theme/get-theme/${id}`,
          post: false,
          showLoading: false,
        });
      },

      getTheme: async () => {
        const resp = await hitAxios({
          path: "/api/theme/active-theme",
          post: false,
          showLoading: false,
        });
        if (resp?.data?.success) {
          setData((prev) => ({
            ...prev,
            themeData: resp?.data?.data?.themeData,
          }));
        }
        return resp;
      },

      setActiveTheme: async (themeId, admin = false) => {
        return await hitAxios({
          path: "/api/theme/set-active-theme",
          obj: { themeId },
          post: true,
          admin: true,
          showLoading: false,
        });
      },

      createTheme: async (payload, admin = false) => {
        return await hitAxios({
          path: "/api/theme/create-theme",
          obj: payload,
          post: true,
          admin: true,
          showLoading: false,
        });
      },

      updateTheme: async (id, themeData, admin = false) => {
        return await hitAxios({
          path: `/api/theme/update-theme/${id}`,
          obj: { themeData },
          post: true,
          admin: true,
          showLoading: false,
        });
      },

      renameTheme: async (id, payload, admin = false) => {
        return await hitAxios({
          path: `/api/theme/rename-theme/${id}`,
          obj: payload,
          post: true,
          admin: true,
          showLoading: false,
        });
      },

      duplicateTheme: async (id, payload = {}, admin = false) => {
        return await hitAxios({
          path: `/api/theme/duplicate-theme/${id}`,
          obj: payload,
          post: true,
          admin: true,
          showLoading: false,
        });
      },

      deleteTheme: async (id, admin = false) => {
        return await hitAxios({
          path: `/api/theme/delete-theme/${id}`,
          obj: {},
          post: true,
          admin: true,
          showLoading: false,
        });
      },

      exportTheme: (id) => {
        window.open(`${API_BASE_URL}/api/theme/export-theme/${id}`, "_blank");
      },

      importTheme: async (payload, admin = false) => {
        return await hitAxios({
          path: "/api/theme/import-theme",
          obj: payload,
          post: true,
          admin: true,
          showLoading: false,
        });
      },

      resetToDefault: async (admin = false) => {
        return await hitAxios({
          path: "/api/theme/reset-to-default",
          obj: {},
          post: true,
          admin: true,
          showLoading: false,
        });
      },

      // ── LEGACY ────────────────────────────────────────────────────────────────

      updateThemePartial: async (updates, admin = false) => {
        return await hitAxios({
          path: "/api/theme/update-theme-partial",
          obj: updates,
          post: true,
          admin: true,
          showLoading: false,
        });
      },

      updateThemeSection: async (section, updates, admin = false) => {
        return await hitAxios({
          path: `/api/theme/update-theme-section/${section}`,
          obj: updates,
          post: true,
          admin: true,
          showLoading: false,
        });
      },

      updateBrandColors: async (colors, admin = false) => {
        return await hitAxios({
          path: "/api/theme/update-brand-colors",
          obj: colors,
          post: true,
          admin: true,
          showLoading: false,
        });
      },

      updateTypography: async (typography, admin = false) => {
        return await hitAxios({
          path: "/api/theme/update-typography",
          obj: typography,
          post: true,
          admin: true,
          showLoading: false,
        });
      },

      updateComponentStyle: async (component, style, admin = false) => {
        return await hitAxios({
          path: `/api/theme/update-component-style/${component}`,
          obj: style,
          post: true,
          admin: true,
          showLoading: false,
        });
      },

      resetTheme: async (admin = false) => {
        return await hitAxios({
          path: "/api/theme/reset-theme-config",
          obj: {},
          post: true,
          admin: true,
          showLoading: false,
        });
      },

      getBackups: async () => {
        return await hitAxios({
          path: "/api/theme/get-theme-backups",
          post: false,
          showLoading: false,
        });
      },

      restoreBackup: async (filename, admin = false) => {
        return await hitAxios({
          path: `/api/theme/restore-theme-backup/${filename}`,
          obj: {},
          post: true,
          admin: true,
          showLoading: false,
        });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    [hitAxios],
  );

  function parseJson(data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  const value = {
    data,
    setData,
    hitAxios,
    showSnack,
    setLoading,
    themeAPI,
    // Convenience accessors
    loading: data.loading,
    snack: data.snack,
    snack_msg: data.snack_msg,
    snack_success: data?.snack_success,
    userData: data.userData,
    themeData: data.themeData,
    parseJson,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};

// Keep the old export for backward compatibility
export { GlobalContext };
