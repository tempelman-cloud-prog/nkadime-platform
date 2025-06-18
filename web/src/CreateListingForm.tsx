import React, { useState } from "react";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "./App";

const API_BASE = "http://localhost:5000/api";

interface JwtPayload {
  userId?: string;
  id?: string;
  email: string;
}

const CreateListingForm: React.FC = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: 0,
    location: "",
    priceUnit: "day"
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageError, setImageError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { showMessage } = useSnackbar();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add a generic handler for textarea and select
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError("");
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Validate each file
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          setImageError("Only image files are allowed.");
          return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          setImageError("Each image must be less than 5MB.");
          return;
        }
      }
      setImages(files);
      setImagePreviews(files.map(file => URL.createObjectURL(file)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem("token");
    let userId = "";
    if (token) {
      const decoded = jwt_decode<JwtPayload>(token);
      userId = decoded.userId || decoded.id || "";
    }
    if (!userId) {
      showMessage("You must be logged in to create a listing.", "error");
      setSubmitting(false);
      return;
    }
    // Prepare form data for image upload
    const formData = new FormData();
    formData.append("owner", userId);
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("category", form.category);
    formData.append("price", String(form.price));
    formData.append("location", form.location);
    formData.append("priceUnit", form.priceUnit);
    images.forEach((img) => formData.append("images", img));
    try {
      const res = await fetch(`${API_BASE}/listings`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      if (res.status === 401 || res.status === 403) {
        showMessage("Session expired or unauthorized. Please log in again.", "error");
        setSubmitting(false);
        return;
      }
      const result = await res.json();
      if (result._id) {
        showMessage("Listing created!", "success");
        setForm({ title: "", description: "", category: "", price: 0, location: "", priceUnit: "day" });
        setImages([]);
        setImagePreviews([]);
        // Redirect to the new listing page after a short delay
        setTimeout(() => {
          navigate(`/listing/${result._id}`);
        }, 800);
      } else {
        showMessage(result.error || "Failed to create listing", "error");
      }
    } catch (err) {
      showMessage("Network or server error. Please try again later.", "error");
    }
    setSubmitting(false);
  };

  return (
    <form className="modern-card" onSubmit={handleSubmit} encType="multipart/form-data" style={{
      maxWidth: 520,
      margin: '40px auto',
      background: 'linear-gradient(120deg, #fff 60%, #FFF3E0 100%)',
      borderRadius: 22,
      boxShadow: '0 8px 32px rgba(255,152,0,0.10)',
      padding: 40,
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
      border: '1.5px solid #FFECB3',
      position: 'relative',
    }}>
      <h2 style={{ textAlign: 'center', color: '#FF9800', fontWeight: 900, marginBottom: 18, letterSpacing: 1, fontSize: 32 }}>Create a New Listing</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontWeight: 700, color: '#333', marginBottom: 2 }}>Title</label>
        <input name="title" placeholder="e.g. Power Drill, Camera, Generator" value={form.title} onChange={handleChange} required style={{ padding: 15, borderRadius: 12, border: '2px solid #ffe0b2', fontSize: 18, outline: 'none', boxShadow: '0 2px 8px #ffecb31a', background: '#FFFDE7', fontWeight: 500 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontWeight: 700, color: '#333', marginBottom: 2 }}>Description</label>
        <textarea name="description" placeholder="Describe your equipment, features, and condition..." value={form.description} onChange={handleTextAreaChange} required rows={3} style={{ padding: 15, borderRadius: 12, border: '2px solid #ffe0b2', fontSize: 17, outline: 'none', boxShadow: '0 2px 8px #ffecb31a', background: '#FFFDE7', fontWeight: 500, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontWeight: 700, color: '#333', marginBottom: 2 }}>Category</label>
          <input name="category" placeholder="e.g. Tools, Electronics" value={form.category} onChange={handleChange} required style={{ padding: 13, borderRadius: 10, border: '2px solid #ffe0b2', fontSize: 17, outline: 'none', background: '#FFFDE7', fontWeight: 500 }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontWeight: 700, color: '#333', marginBottom: 2 }}>Location</label>
          <input name="location" placeholder="e.g. Nairobi, Westlands" value={form.location} onChange={handleChange} required style={{ padding: 13, borderRadius: 10, border: '2px solid #ffe0b2', fontSize: 17, outline: 'none', background: '#FFFDE7', fontWeight: 500 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontWeight: 700, color: '#333', marginBottom: 2 }}>Price</label>
          <input name="price" type="number" min={0} placeholder="e.g. 500" value={form.price} onChange={handleChange} required style={{ padding: 13, borderRadius: 10, border: '2px solid #ffe0b2', fontSize: 17, outline: 'none', background: '#FFFDE7', fontWeight: 500 }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontWeight: 700, color: '#333', marginBottom: 2 }}>Price Unit</label>
          <select name="priceUnit" value={form.priceUnit} onChange={handleSelectChange} style={{ padding: 13, borderRadius: 10, border: '2px solid #ffe0b2', fontSize: 17, outline: 'none', background: '#FFFDE7', fontWeight: 500 }}>
            <option value="hour">Per Hour</option>
            <option value="day">Per Day</option>
            <option value="week">Per Week</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontWeight: 700, color: '#333', marginBottom: 2 }}>Equipment Images</label>
        <div style={{
          border: '2.5px dashed #FFB74D',
          borderRadius: 16,
          background: '#FFF8E1',
          padding: 18,
          textAlign: 'center',
          marginBottom: 8,
          position: 'relative',
          minHeight: 120,
        }}>
          <input
            name="images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            style={{
              opacity: 0,
              width: '100%',
              height: 120,
              position: 'absolute',
              left: 0,
              top: 0,
              cursor: 'pointer',
              zIndex: 2,
            }}
            aria-label="Upload equipment images"
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{ color: '#FF9800', fontWeight: 700, fontSize: 18 }}>
              Click or drag to upload clear images of your equipment
            </span>
            <div style={{ color: '#888', fontSize: 14, marginTop: 4 }}>
              (Max 5MB per image, JPG/PNG preferred)
            </div>
          </div>
        </div>
        {imageError && <div style={{ color: 'red', marginBottom: 12 }}>{imageError}</div>}
        <div style={{ display: 'flex', gap: 16, margin: '12px 0', flexWrap: 'wrap' }}>
          {imagePreviews.map((src, idx) => (
            <div key={idx} style={{ position: 'relative', width: 110, height: 110, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px #ffb74d33', border: '2px solid #FFECB3', background: '#fff' }}>
              <img src={src} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} />
              <button
                type="button"
                onClick={() => {
                  const newImages = images.filter((_, i) => i !== idx);
                  const newPreviews = imagePreviews.filter((_, i) => i !== idx);
                  setImages(newImages);
                  setImagePreviews(newPreviews);
                }}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  background: '#fff',
                  color: '#C62828',
                  border: '1.5px solid #C62828',
                  borderRadius: '50%',
                  width: 26,
                  height: 26,
                  fontWeight: 900,
                  fontSize: 18,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px #0002',
                  zIndex: 3,
                }}
                aria-label="Remove image"
                title="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
      <button type="submit" disabled={submitting} style={{
        background: 'linear-gradient(90deg, #FF9800 0%, #FFB74D 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        padding: '15px 0',
        fontWeight: 800,
        fontSize: 21,
        boxShadow: '0 2px 8px #ffb74d33',
        cursor: submitting ? 'not-allowed' : 'pointer',
        marginTop: 10,
        transition: 'background 0.2s, box-shadow 0.2s',
        letterSpacing: 0.5,
      }}>{submitting ? "Creating..." : "Create Listing"}</button>
    </form>
  );
};

export default CreateListingForm;