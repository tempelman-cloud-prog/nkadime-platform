import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUserReviews } from "./api";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

const ProfileReviews: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      setError("");
      try {
        const revs = await getUserReviews(userId!);
        setReviews(revs);
      } catch (err) {
        setError("Failed to load reviews.");
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [userId]);

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h4" fontWeight={800} color="#FF9800" mb={2}>User Reviews</Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : reviews.length === 0 ? (
        <Alert severity="info">No reviews found for this user.</Alert>
      ) : (
        <Box>
          {reviews.map((r: any) => (
            <Box key={r._id} sx={{ background: '#fff', borderRadius: 2, boxShadow: 1, mb: 2, p: 2 }}>
              <Typography fontWeight={700} color="#FF9800">Rating: {r.rating}</Typography>
              <Typography fontWeight={600} mt={1}>Comment:</Typography>
              <Typography mb={1}>{r.comment}</Typography>
              <Typography color="text.secondary" fontSize={13} mb={1}>By: {typeof r.reviewer === 'object' && r.reviewer !== null && 'name' in r.reviewer ? r.reviewer.name : r.reviewer}</Typography>
              <Typography color="text.secondary" fontSize={12}>{new Date(r.createdAt).toLocaleString()}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ProfileReviews;
