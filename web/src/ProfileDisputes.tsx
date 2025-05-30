import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRentalHistory } from "./api";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";

const ProfileDisputes: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [disputes, setDisputes] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDisputes() {
      setLoading(true);
      setError("");
      try {
        const history = await getRentalHistory(userId!);
        setDisputes((history || []).filter((r: any) => r.dispute && r.dispute.status));
      } catch (err) {
        setError("Failed to load disputes.");
      } finally {
        setLoading(false);
      }
    }
    fetchDisputes();
  }, [userId]);

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h4" fontWeight={800} color="#C62828" mb={2}>Disputes</Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : disputes.length === 0 ? (
        <Alert severity="info">No disputes found for this user.</Alert>
      ) : (
        <Box>
          {disputes.map((d: any) => (
            <Box key={d._id} sx={{ background: '#fff', borderRadius: 2, boxShadow: 1, mb: 2, p: 2 }}>
              <Typography fontWeight={700} color="#C62828">Status: {d.dispute.status}</Typography>
              <Typography fontWeight={600} mt={1}>Reason:</Typography>
              <Typography mb={1}>{d.dispute.reason}</Typography>
              {d.dispute.evidenceUrl && (
                <Typography mb={1}>
                  <b>Evidence:</b> <a href={d.dispute.evidenceUrl} target="_blank" rel="noopener noreferrer">View</a>
                </Typography>
              )}
              <Typography color="text.secondary" fontSize={13} mb={1}>
                Rental: <Button variant="text" size="small" onClick={() => navigate(`/my-rentals?focus=${d._id}`)} sx={{ p: 0, minWidth: 0, fontWeight: 700, color: '#1976D2', textDecoration: 'underline', textTransform: 'none' }}>View Transaction</Button>
              </Typography>
              <Typography color="text.secondary" fontSize={12}>Raised: {d.dispute.raisedAt ? new Date(d.dispute.raisedAt).toLocaleString() : "-"}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ProfileDisputes;
