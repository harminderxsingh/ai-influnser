import { Category, Save } from "@mui/icons-material";
import {
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import CommonDialog from "../../../common/CommonDialog";
import React from "react";

const AddCate = ({ lang, handleGetCate, hitAxios }) => {
  const [state, setState] = React.useState({
    dialog: false,
    name: "",
    color: "#FFFFFF",
  });

  async function handleSave(params) {
    const res = await hitAxios({
      path: "/api/admin/add_t_cate",
      post: true,
      admin: true,
      obj: state,
    });
    if (res.data.success) {
      await handleGetCate();
      setState({ ...state, dialog: false, name: "", color: "#FFFFFF" });
    }
  }

  return (
    <div>
      <Button
        onClick={() => setState({ ...state, dialog: true })}
        startIcon={<Category />}
        variant="contained"
        size="large"
      >
        {lang.addCategory || "Add Category"}
      </Button>

      <CommonDialog
        maxWidth="sm"
        open={state.dialog}
        onClose={() => setState({ ...state, dialog: false })}
        icon={Category}
        title={lang.addCategory || "Add Category"}
      >
        <Box mt={2}>
          <Stack direction={"column"} spacing={3}>
            <TextField
              value={state.name}
              onChange={(e) => setState({ ...state, name: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={lang.chooseColor || "Choose color"}>
                      <Box
                        sx={{
                          padding: 2,
                          borderRadius: "50%",
                          bgcolor: state.color,
                          border: "3px solid",
                          borderColor: "purple",
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <input
                          type="color"
                          value={state.color}
                          onChange={(e) =>
                            setState({ ...state, color: e.target.value })
                          }
                          style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            opacity: 0,
                            cursor: "pointer",
                          }}
                        />
                      </Box>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              placeholder={lang.latest || "Latest"}
            />

            <Stack direction={"row"} justifyContent={"flex-end"}>
              <Button
                onClick={handleSave}
                size="large"
                variant="contained"
                startIcon={<Save />}
              >
                {lang.save || "Save"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CommonDialog>
    </div>
  );
};

export default AddCate;
