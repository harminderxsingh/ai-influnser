import { Button, CircularProgress } from "@mui/material";
import React from "react";
import { GlobalContext } from "../../../context/GlobalContext";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const Free = ({ plan, paying, setPaying, lang }) => {
  const { loading, hitAxios } = React.useContext(GlobalContext);
  const history = useHistory();

  async function handleFree(params) {
    const res = await hitAxios({
      path: "/api/payment/get_free_trial",
      post: true,
      admin: false,
      obj: { id: plan?.id },
    });
    if (res.data.success) {
      history.push("/user");
    }
  }

  return (
    <div>
      <Button
        onClick={handleFree}
        fullWidth
        variant="outlined"
        size="large"
        disabled={!!paying}
        // onClick={handleMercadoPago}
        startIcon={
          loading ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <span style={{ fontSize: "1.1rem" }}>🛒</span>
          )
        }
        sx={{
          justifyContent: "flex-start",
          borderRadius: 2,
          fontWeight: 600,
          textTransform: "none",
          fontSize: "0.95rem",
          py: 1.2,
        }}
      >
        {lang?.getStarted || "Get Started"}
      </Button>
    </div>
  );
};

export default Free;
