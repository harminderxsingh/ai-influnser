import { Alert, Box, Chip, Stack, Tooltip, Typography } from "@mui/material";
import React from "react";
import CommonDialog from "../../../common/CommonDialog";
import { Paid, PaidOutlined } from "@mui/icons-material";
import { GlobalContext } from "../../../context/GlobalContext";
import moment from "moment";

const UpdatePlan = ({ lang, hitAxios, params, hangleGetUsers }) => {
  const [plans, setPlans] = React.useState([]);
  const { parseJson } = React.useContext(GlobalContext);
  const parsedPlan = parseJson(params?.row?.plan);
  const planEnding = params?.row?.plan_ending;
  const isExpired = planEnding && new Date(planEnding) < new Date();

  async function getPlans(params) {
    const res = await hitAxios({
      path: "/api/web/get_all_plans",
      post: false,
      admin: false,
    });
    if (res.data.success) {
      setPlans(res.data.data);
    }
  }

  const [state, setState] = React.useState({
    dialog: false,
  });

  function changeState(key, data) {
    setState({ ...state, [key]: data });
  }

  async function updatePlan(planId, uid) {
    const res = await hitAxios({
      path: "/api/admin/update_user_plan",
      post: true,
      admin: true,
      obj: { planId, uid },
    });
    if (res.data.success) {
      hangleGetUsers();
      changeState("dialog", false);
    }
  }

  React.useEffect(() => {
    getPlans();
  }, []);

  return (
    <div>
      <Tooltip
        title={
          planEnding
            ? isExpired
              ? `⚠️ Expired ${moment(planEnding).fromNow()}`
              : `✅ Ends ${moment(planEnding).format("DD MMM YYYY")}`
            : lang.noPlan || "No Plan"
        }
      >
        <Chip
          icon={params?.value ? <PaidOutlined /> : null}
          onClick={() => changeState("dialog", true)}
          label={params.value ? parsedPlan?.title : lang.noPlan || "No Plan"}
          size="small"
          variant={isExpired ? "filled" : "outlined"}
          color={isExpired ? "error" : "default"}
        />
      </Tooltip>

      <CommonDialog
        open={state.dialog}
        onClose={() => changeState("dialog", false)}
        title={state.changePlan || "Change Plan"}
        icon={Paid}
        maxWidth="sm"
      >
        {/* {JSON.stringify(plans)} */}
        <Box mt={2}>
          <Stack direction={"column"} spacing={2}>
            <Alert severity="info">
              {lang.clickToChangeP || "Click on the Chip to change plan"}
            </Alert>

            <Stack
              direction={"row"}
              spacing={2}
              sx={{
                overflowX: "auto",
                "&::-webkit-scrollbar": { display: "none" },
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              {plans?.map((i, key) => {
                return (
                  <Chip
                    onClick={() => updatePlan(i.id, params?.row?.uid)}
                    sx={{ width: "100%" }}
                    variant={
                      parseJson(params?.row?.plan)
                        ? parseJson(params?.row?.plan)?.id === i?.id
                          ? "filled"
                          : "outlined"
                        : "outlined"
                    }
                    icon={<PaidOutlined />}
                    size="large"
                    label={`${i.title} - ${i?.credits}`}
                    key={key}
                  />
                );
              })}
            </Stack>
          </Stack>
        </Box>
      </CommonDialog>
    </div>
  );
};

export default UpdatePlan;
