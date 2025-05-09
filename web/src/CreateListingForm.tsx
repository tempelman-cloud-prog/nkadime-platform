import React, { useState } from "react";
import jwt_decode from "jwt-decode";

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
    const token = localStorage.getItem("token");
    let userId = "";
    if (token) {
      const decoded = jwt_decode<JwtPayload>(token);
      userId = decoded.userId || decoded.id || "";
    }
    if (!userId) {
      setMessage("You must be logged in to create a listing.");
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
    images.forEach((img, idx) => formData.append("images", img));
    // Use a new API endpoint for multipart upload, or update createListing to handle FormData
    const res = await fetch(`${API_BASE}/listings`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    const result = await res.json();
    if (result._id) {
      setMessage("Listing created!");
      setForm({ title: "", description: "", category: "", price: 0, location: "", priceUnit: "day" });
      setImages([]);
      setImagePreviews([]);
    } else {
      setMessage(result.error || "Failed to create listing");
    }
  };

  return (
    <form className="modern-card" onSubmit={handleSubmit} encType="multipart/form-data">
      <h2>Create Listing</h2>
      <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
      <input name="description" placeholder="Description" value={form.description} onChange={handleChange} required />
      <input name="category" placeholder="Category" value={form.category} onChange={handleChange} required />
      <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} required />
      <input name="location" placeholder="Location" value={form.location} onChange={handleChange} required />
      <input name="images" type="file" multiple accept="image/*" onChange={handleImageChange} />
      {imageError && <div style={{ color: 'red', marginBottom: 8 }}>{imageError}</div>}
      <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
        {imagePreviews.map((src, idx) => (
          <img key={idx} src={src} alt="preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
        ))}
      </div>
      <button type="submit">Create</button>
      <div>{message}</div>
    </form>
  );
};

export default CreateListingForm;