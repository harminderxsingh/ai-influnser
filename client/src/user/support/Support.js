// components/support/Support.jsx
import React from "react";
import {
  AddCommentOutlined,
  SendOutlined,
  SupportAgent,
} from "@mui/icons-material";
import { Box, Button, Grid, Stack, TextField } from "@mui/material";
import { GlobalContext } from "../../context/GlobalContext";
import CommonDialog from "../../common/CommonDialog";
import PageHeader from "../../common/PageHeader";
import ContactAndConversations from "./components/ContactAndConversations";
import FaqPanel from "./components/FaqPanel";

const Support = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);

  const [message, setMessage] = React.useState("");
  const [dialog, setDialog] = React.useState(false);
  const [conversations, setConversations] = React.useState([]);

  async function getMyQues() {
    const res = await hitAxios({
      path: "/api/support/get_my_que",
      post: false,
      admin: false,
    });
    if (res.data.success) setConversations(res.data.data);
  }

  async function handleSendMsg() {
    if (!message.trim()) return;
    const res = await hitAxios({
      path: "/api/support/add_que",
      post: true,
      admin: false,
      obj: { que: message },
    });
    if (res.data.success) {
      setMessage("");
      setDialog(false);
      getMyQues();
    }
  }

  React.useEffect(() => {
    getMyQues();
  }, []);

  const handleOpenDialog = () => {
    setMessage("");
    setDialog(true);
  };
  const handleCloseDialog = () => {
    setMessage("");
    setDialog(false);
  };

  return (
    <Box>
      <PageHeader
        icon={SupportAgent}
        primaryAction={
          <Button
            variant="contained"
            size="large"
            startIcon={<AddCommentOutlined />}
            onClick={handleOpenDialog}
          >
            {lang?.newMessage || "New Message"}
          </Button>
        }
        title={lang?.help || "Help"}
        subtitle={lang?.helpSub || "Feeling trouble? Write to us!"}
      />

      <Box>
        <Grid container spacing={3}>
          {/* Left column */}
          <Grid item xs={12} lg={7}>
            <ContactAndConversations
              lang={lang}
              conversations={conversations}
              onOpenDialog={handleOpenDialog}
            />
          </Grid>

          {/* Right column */}
          <Grid item xs={12} lg={5}>
            <FaqPanel lang={lang} />
          </Grid>
        </Grid>
      </Box>

      {/* New Message Dialog */}
      <CommonDialog
        open={dialog}
        onClose={handleCloseDialog}
        title={lang?.newMessage || "New Message"}
        icon={AddCommentOutlined}
        maxWidth="sm"
        fullWidth
      >
        <Box mt={2}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              multiline
              rows={5}
              autoFocus
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                lang?.messagePlaceholder || "Write your message here..."
              }
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
                onClick={handleSendMsg}
                disabled={!message.trim()}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                {lang?.sendMsg || "Send Message"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CommonDialog>
    </Box>
  );
};

export default Support;
