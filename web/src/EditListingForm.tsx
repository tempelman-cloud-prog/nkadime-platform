import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getListings, updateListing } from "./api";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Alert from '@mui/material/Alert';

const EditListingForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: 0,
    priceUnit: "day",
    location: ""
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    async function fetchListing() {
      try {
        const allListings = await getListings();
        const found = (allListings.listings || []).find((l: any) => l._id === id);
        if (found) {
          setForm({
            title: found.title || "",
            description: found.description || "",
            category: found.category || "",
            price: found.price || 0,
            priceUnit: found.priceUnit || "day",
            location: found.location || ""
          });
        } else {
          setError("Listing not found.");
        }
      } catch (err) {
        setError("Failed to load listing. Please try again.");
      }
      setLoading(false);
    }
    fetchListing();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setLightboxOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      let result;
      if (imageFile) {
        // If an image is selected, use FormData
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('category', form.category);
        formData.append('price', String(form.price));
        formData.append('priceUnit', form.priceUnit);
        formData.append('location', form.location);
        formData.append('images', imageFile); // <-- changed from 'image' to 'images'
        result = await updateListing(id!, formData); // updateListing should handle FormData
      } else {
        result = await updateListing(id!, form);
      }
      if (!result.error) {
        setMessage("Listing updated!");
        setTimeout(() => navigate(`/listing/${id}`), 1000);
      } else {
        setMessage(result.error || "Failed to update listing");
      }
    } catch (err) {
      setMessage("Network or server error. Please try again later.");
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <CircularProgress />
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: '2em auto', padding: '2em 1em', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
      <Typography variant="h5" fontWeight={700} color="#FF9800" mb={3}>Edit Listing</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
          fullWidth
          required
          multiline
          minRows={2}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Category"
          name="category"
          value={form.category}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Price"
          name="price"
          type="number"
          value={form.price}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Price Unit"
          name="priceUnit"
          value={form.priceUnit}
          onChange={handleChange}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Location"
          name="location"
          value={form.location}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          type="file"
          inputProps={{ accept: 'image/*' }}
          onChange={handleImageChange}
          fullWidth
          sx={{ mb: 2 }}
        />
        {/* Show thumbnail and preview button if image is selected */}
        {imagePreview && (
          <Box mb={2} display="flex" alignItems="center" gap={2}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '2px solid #eee' }}
              onClick={() => setLightboxOpen(true)}
            />
            <Button variant="outlined" onClick={() => setLightboxOpen(true)}>
              Preview
            </Button>
          </Box>
        )}
        <Button type="submit" variant="contained" color="primary" disabled={submitting} sx={{ fontWeight: 700, borderRadius: 2 }}>
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
        <Box mt={2} color={message.includes('error') ? 'red' : '#333'}>{message}</Box>
      </form>
      {imagePreview && (
        <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth="md">
          <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#222' }}>
            <img src={imagePreview} alt="Preview" style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 12, boxShadow: '0 4px 32px #000a' }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EditListingForm;
