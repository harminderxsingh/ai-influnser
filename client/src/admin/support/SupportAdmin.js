import React from "react";
import {
  AdminPanelSettingsOutlined,
  PersonOutlined,
  ReplyOutlined,
  SendOutlined,
  SupportAgent,
} from "@mui/icons-material";
import {
  alpha,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { GlobalContext } from "../../context/GlobalContext";
import CommonDialog from "../../common/CommonDialog";
import PageHeader from "../../common/PageHeader";
import StatsAndList from "./components/StatsAndList";

const LIMIT = 20;

const SupportAdmin = ({ lang }) => {
  const theme = useTheme();
  const { hitAxios } = React.useContext(GlobalContext);

  const [allQue, setAllQue] = React.useState([]);
  const [offset, setOffset] = React.useState(0);
  const [total, setTotal] = React.useState(0);
  const [selected, setSelected] = React.useState(null);
  const [ans, setAns] = React.useState("");
  const [dialog, setDialog] = React.useState(false);

  // Fetch
  async function hangleGetQues(reset = false) {
    const currentOffset = reset ? 0 : offset;
    const res = await hitAxios({
      path: `/api/support/get_all_que?limit=${LIMIT}&offset=${currentOffset}`,
      post: false,
      admin: true,
    });
    if (res.data.success) {
      if (reset) {
        setAllQue(res.data.data);
        setOffset(LIMIT);
      } else {
        setAllQue((prev) => [...prev, ...res.data.data]);
        setOffset((prev) => prev + LIMIT);
      }
      setTotal(res.data.total);
    }
  }

  // Delete
  async function handleDelete(id) {
    if (window.confirm(lang.aus)) {
      const res = await hitAxios({
        path: "/api/support/del_que",
        post: true,
        admin: true,
        obj: { id },
      });
      if (res.data.success) {
        setAllQue((prev) => prev.filter((q) => q.id !== id));
        setTotal((prev) => prev - 1);
      }
    }
  }

  // Reply
  async function handleSubmitReply() {
    if (!ans.trim() || !selected) return;
    const res = await hitAxios({
      path: "/api/support/add_reply",
      post: true,
      admin: true,
      obj: { id: selected.id, ans: ans.trim() },
    });
    if (res.data.success) {
      setDialog(false);
      setAns("");
      setSelected(null);
      hangleGetQues(true);
    }
  }

  const handleOpenReply = (item) => {
    setSelected(item);
    setAns(item.ans || "");
    setDialog(true);
  };

  const handleCloseDialog = () => {
    setDialog(false);
    setAns("");
    setSelected(null);
  };

  React.useEffect(() => {
    hangleGetQues(true);
  }, []);

  const hasMore = allQue.length < total;

  return (
    <Box>
      <PageHeader
        title={lang?.help || "Help"}
        subtitle={lang?.helpAdminSub || "Answer queries asked by users"}
        icon={SupportAgent}
        primaryAction={null}
      />

      <StatsAndList
        lang={lang}
        allQue={allQue}
        total={total}
        hasMore={hasMore}
        onLoadMore={() => hangleGetQues(false)}
        onReply={handleOpenReply}
        onDelete={handleDelete}
      />

      {/* Reply Dialog */}
      <CommonDialog
        open={dialog}
        onClose={handleCloseDialog}
        title={
          selected?.ans
            ? lang?.editReply || "Edit Reply"
            : lang?.replyNow || "Reply Now"
        }
        icon={selected?.ans ? AdminPanelSettingsOutlined : ReplyOutlined}
        maxWidth="sm"
        fullWidth
      >
        <Box mt={2}>
          <Stack spacing={3}>
            {/* User question preview */}
            <Box
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                borderRadius: 2,
                p: 1.5,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <PersonOutlined
                  sx={{ fontSize: 16, color: "primary.main", mt: 0.2 }}
                />
                <Box>
                  <Typography
                    variant="caption"
                    color="primary.main"
                    fontWeight={700}
                  >
                    {lang?.userQuestion || "User's Question"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.3, lineHeight: 1.6 }}
                  >
                    {selected?.que}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={5}
              autoFocus
              label={lang?.yourReply || "Your Reply"}
              value={ans}
              onChange={(e) => setAns(e.target.value)}
              placeholder={lang?.replyPlaceholder || "Type your reply here..."}
              size="small"
            />

            <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
              <Button
                variant="outlined"
                onClick={handleCloseDialog}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                {lang?.cancel || "Cancel"}
              </Button>
              <Button
                variant="contained"
                endIcon={<SendOutlined />}
                onClick={handleSubmitReply}
                disabled={!ans.trim()}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                {lang?.sendReply || "Send Reply"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CommonDialog>
    </Box>
  );
};

export default SupportAdmin;
