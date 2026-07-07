import { Group, Login } from "@mui/icons-material";
import React from "react";
import PageHeader from "../../common/PageHeader";
import { GlobalContext } from "../../context/GlobalContext";
import {
  Box,
  Chip,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Paper,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import ViewUser from "./components/ViewUser";
import UpdatePlan from "./components/UpdatePlan";
import UpdateCredit from "./components/UpdateCredit";

const Users = ({ lang }) => {
  const [users, setUsers] = React.useState([]);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const { hitAxios } = React.useContext(GlobalContext);

  async function hangleGetUsers() {
    const res = await hitAxios({
      path: "/api/admin/get_users",
      post: false,
      admin: true,
    });
    if (res.data.success) {
      setUsers(res.data.data);
    }
  }

  React.useEffect(() => {
    hangleGetUsers();
  }, []);

  const handleDeleteUsers = async () => {
    console.log("Selected rows:", selectedRows); // Debug log

    if (!selectedRows || selectedRows.length === 0) {
      alert("Please select users to delete");
      return;
    }

    if (!window.confirm(lang.aus || "Are you sure?")) return;

    const res = await hitAxios({
      path: "/api/admin/delete_users",
      post: true,
      admin: true,
      obj: { userIds: selectedRows },
    });

    if (res.data.success) {
      setUsers(users.filter((user) => !selectedRows.includes(user.uid)));
      setSelectedRows([]);
    }
  };

  function CustomToolbar() {
    return (
      <GridToolbarContainer>
        <GridToolbarFilterButton />
        <GridToolbarExport />
        {selectedRows.length > 0 && (
          <Button
            startIcon={<DeleteIcon />}
            color="error"
            size="small"
            onClick={handleDeleteUsers}
          >
            {lang.deleteSelected || "Delete"} ({selectedRows.length})
          </Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <GridToolbarQuickFilter />
      </GridToolbarContainer>
    );
  }

  async function autoLogin(uid) {
    const res = await hitAxios({
      path: "/api/admin/auto_login",
      post: true,
      admin: true,
      obj: { uid },
    });
    if (res.data.success) {
      localStorage.setItem(
        process.env.REACT_APP_TOKEN + "_user",
        res.data.token,
      );
      window.open("/user");
    }
  }

  const columns = [
    {
      field: "name",
      headerName: lang.name || "Name",
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Tooltip title={lang?.autoLogin || "Auto Login"}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation(); // ✅ add this
                autoLogin(params?.row?.uid);
              }}
              color="primary"
            >
              <Login />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {params.row.name || lang.noName || "No Name"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: lang.status || "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === "active" ? "success" : "error"}
        />
      ),
    },
    {
      field: "plan",
      headerName: lang.plan || "Plan",
      width: 120,
      renderCell: (params) => (
        <Box onClick={(e) => e.stopPropagation()}>
          <UpdatePlan
            hangleGetUsers={hangleGetUsers}
            params={params}
            lang={lang}
            hitAxios={hitAxios}
          />
        </Box>
      ),
    },
    {
      field: "credits",
      headerName: lang.credits || "Credits",
      width: 100,
      renderCell: (params) => (
        <Box onClick={(e) => e.stopPropagation()}>
          <UpdateCredit
            hitAxios={hitAxios}
            hangleGetUsers={hangleGetUsers} // ✅ fixed
            lang={lang}
            params={params}
          />
        </Box>
      ),
    },
    {
      field: "createdAt",
      headerName: lang.joined || "Joined",
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {new Date(params.value).toLocaleDateString()}
          </Typography>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: lang.actions || "Actions",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box onClick={(e) => e.stopPropagation()}>
          <ViewUser
            hangleGetUsers={hangleGetUsers}
            hitAxios={hitAxios}
            lang={lang}
            params={params}
          />
        </Box>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={lang.users || "Users"}
        subtitle={lang.usersDes || "Manage Users"}
        icon={Group}
        primaryAction={""}
        secondaryActions={""}
      />

      <Paper>
        <Box sx={{ height: 600, width: "100%" }}>
          <DataGrid
            disableRowSelectionOnClick
            rows={users}
            columns={columns}
            getRowId={(row) => row.uid}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            checkboxSelection
            disableSelectionOnClick
            onRowSelectionModelChange={(newSelection) => {
              console.log("Selection changed:", newSelection); // Debug log
              setSelectedRows(newSelection);
            }}
            rowSelectionModel={selectedRows}
            slots={{
              toolbar: CustomToolbar,
            }}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage % 2 === 0
                ? "even-row"
                : "odd-row"
            }
            sx={{
              "& .even-row": {
                bgcolor: "background.default",
              },
              "& .odd-row": {
                bgcolor: "background.paper",
              },
            }}
          />
        </Box>
      </Paper>
    </div>
  );
};

export default Users;
