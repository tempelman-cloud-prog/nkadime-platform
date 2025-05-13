import React, { useState } from "react";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";

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
  const [message, setMessage] = useState("");
  const [imageError, setImageError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setMessage("");
    const token = localStorage.getItem("token");
    let userId = "";
    if (token) {
      const decoded = jwt_decode<JwtPayload>(token);
      userId = decoded.userId || decoded.id || "";
    }
    if (!userId) {
      setMessage("You must be logged in to create a listing.");
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
        setMessage("Session expired or unauthorized. Please log in again.");
        setSubmitting(false);
        return;
      }
      const result = await res.json();
      if (result._id) {
        setMessage("Listing created!");
        setForm({ title: "", description: "", category: "", price: 0, location: "", priceUnit: "day" });
        setImages([]);
        setImagePreviews([]);
        // Redirect to the new listing page after a short delay
        setTimeout(() => {
          navigate(`/listing/${result._id}`);
        }, 800);
      } else {
        setMessage(result.error || "Failed to create listing");
      }
    } catch (err) {
      setMessage("Network or server error. Please try again later.");
    }
    setSubmitting(false);
  };

  return (
    <form className="modern-card" onSubmit={handleSubmit} encType="multipart/form-data" style={{
      maxWidth: 480,
      margin: '32px auto',
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      padding: 32,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }}>
      <h2 style={{ textAlign: 'center', color: '#FF9800', fontWeight: 800, marginBottom: 16 }}>Create Listing</h2>
      <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required style={{ padding: 16, borderRadius: 14, border: '2px solid #e0e0e0', fontSize: 19, marginBottom: 6, transition: 'border 0.2s', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} />
      <input name="description" placeholder="Description" value={form.description} onChange={handleChange} required style={{ padding: 16, borderRadius: 14, border: '2px solid #e0e0e0', fontSize: 19, marginBottom: 6, transition: 'border 0.2s', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} />
      <input name="category" placeholder="Category" value={form.category} onChange={handleChange} required style={{ padding: 16, borderRadius: 14, border: '2px solid #e0e0e0', fontSize: 19, marginBottom: 6, transition: 'border 0.2s', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} />
      <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} required style={{ padding: 16, borderRadius: 14, border: '2px solid #e0e0e0', fontSize: 19, marginBottom: 6, transition: 'border 0.2s', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} />
      <input name="location" placeholder="Location" value={form.location} onChange={handleChange} required style={{ padding: 16, borderRadius: 14, border: '2px solid #e0e0e0', fontSize: 19, marginBottom: 6, transition: 'border 0.2s', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} />
      <input name="images" type="file" multiple accept="image/*" onChange={handleImageChange} style={{ marginTop: 8, marginBottom: 6 }} />
      {imageError && <div style={{ color: 'red', marginBottom: 12 }}>{imageError}</div>}
      <div style={{ display: 'flex', gap: 16, margin: '12px 0' }}>
        {imagePreviews.map((src, idx) => (
          <img key={idx} src={src} alt="preview" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', border: '2px solid #eee', transition: 'box-shadow 0.2s' }} />
        ))}
      </div>
      <button type="submit" disabled={submitting} style={{
        background: 'linear-gradient(90deg, #FF9800 0%, #FFB74D 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: 10,
        padding: '12px 30px',
        fontWeight: 700,
        fontSize: 19,
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        cursor: submitting ? 'not-allowed' : 'pointer',
        marginTop: 10,
        transition: 'background 0.2s, box-shadow 0.2s',
        letterSpacing: 0.5,
      }}>{submitting ? "Creating..." : "Create"}</button>
      <div style={{ minHeight: 24, color: message.includes('error') ? 'red' : '#333', marginTop: 8, textAlign: 'center', fontSize: 15 }}>{message}</div>
    </form>
  );
};

export default CreateListingForm;