import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRentalHistory } from "./api";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";

interface Rental {
  _id: string;
  listing: { title: string; _id: string } | string;
  owner: { name: string; _id: string } | string;
  renter: { name: string; _id: string } | string;
  status: string;
  startDate: string;
  endDate: string;
  amount?: number;
  payment?: { amount?: number };
  createdAt: string;
}

const ProfileTransactions: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rentals, setRentals] = useState<Rental[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const data = await getRentalHistory(userId!);
        setRentals(Array.isArray(data) ? data : (data && Array.isArray(data.rentals) ? data.rentals : []));
      } catch (e) {
        setError("Failed to load transactions.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h5" fontWeight={700} color="#0a2342" mb={2}>
        Transactions
      </Typography>
      {loading ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : rentals.length === 0 ? (
        <Typography color="text.secondary">No transactions found.</Typography>
      ) : (
        <Box>
          {rentals.map((r) => (
            <Paper key={r._id} sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 1 }}>
              <Typography fontWeight={600}>
                Listing: {r.listing && typeof r.listing === "object" ? r.listing.title : r.listing ? r.listing : "Listing deleted"}
              </Typography>
              <Typography>
                Owner: {typeof r.owner === "object" ? r.owner.name : r.owner}
              </Typography>
              <Typography>
                Renter: {typeof r.renter === "object" ? r.renter.name : r.renter}
              </Typography>
              <Typography>Status: {r.status}</Typography>
              <Typography>
                Dates: {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
              </Typography>
              <Typography>
                Amount: {typeof r.amount === 'number' ? r.amount : (r.payment && typeof r.payment.amount === 'number' ? r.payment.amount : 'N/A')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Created: {new Date(r.createdAt).toLocaleString()}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ProfileTransactions;
