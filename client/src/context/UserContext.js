import axios from "axios";
import React, { createContext, useContext, useState, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { GlobalContext } from "./GlobalContext";

const UserContext = createContext(null);

// Custom hook for using the context
export const useGlobal = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useGlobal must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children, navigateToPage }) => {
  const [userData, setUserData] = React.useState({});
  const { hitAxios } = React.useContext(GlobalContext);

  async function getUserData(params) {
    const res = await hitAxios({
      path: "/api/user/get_me",
      post: false,
      admin: false,
      showLoading: false,
    });
    if (res?.data?.success) {
      setUserData(res.data.data);
    }
  }

  React.useEffect(() => {
    getUserData();
  }, []);

  const value = { getUserData, userData, setUserData, navigateToPage };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Keep the old export for backward compatibility
export { UserContext };
