import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getListings, getReviews, createReview } from "./api";
import jwt_decode from "jwt-decode";

interface Review {
  _id: string;
  reviewer: string;
  rating: number;
  comment: string;
  createdAt: string;
  images?: string[];
}

interface Listing {
  _id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  priceUnit?: string;
  location: string;
  owner: string;
  available: boolean;
}

interface JwtPayload {
  userId?: string;
  id?: string;
  email?: string;
}

const ListingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewMsg, setReviewMsg] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const [reviewImageError, setReviewImageError] = useState("");
  const [lightboxReviewImg, setLightboxReviewImg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const allListings = await getListings();
      const found = allListings.find((l: Listing) => l._id === id);
      setListing(found || null);
      const revs = await getReviews(id!);
      setReviews(revs);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const handleReviewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReviewForm({ ...reviewForm, [e.target.name]: e.target.value });
  };

  const handleReviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReviewImageError("");
    if (e.target.files) {
      const files = Array.from(e.target.files);
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          setReviewImageError("Only image files are allowed for reviews.");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setReviewImageError("Each review image must be less than 5MB.");
          return;
        }
      }
      setReviewImages(files);
      setReviewImagePreviews(files.map(file => URL.createObjectURL(file)));
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setReviewMsg("You must be logged in to post a review.");
      return;
    }
    let reviewer = "";
    try {
      const decoded = jwt_decode<JwtPayload>(token);
      reviewer = decoded.userId || decoded.id || "";
    } catch {
      setReviewMsg("Invalid token.");
      return;
    }
    let result;
    if (reviewImages.length > 0) {
      // Use FormData to send images and review data
      const formData = new FormData();
      formData.append("listing", id!);
      formData.append("reviewer", reviewer);
      formData.append("rating", String(reviewForm.rating));
      formData.append("comment", reviewForm.comment);
      reviewImages.forEach(img => formData.append("images", img));
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      result = await res.json();
    } else {
      // No images, use JSON
      result = await createReview({
        listing: id!,
        reviewer,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
        images: []
      });
    }
    if (result._id) {
      setReviewMsg("Review posted!");
      setReviews([...reviews, result]);
      setReviewForm({ rating: 5, comment: "" });
      setReviewImages([]);
      setReviewImagePreviews([]);
    } else {
      setReviewMsg(result.error || "Failed to post review");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!listing) return <div>Listing not found.</div>;

  return (
    <div className="modern-card" style={{ maxWidth: 700, margin: '2.5em auto', padding: '2em 1.5em' }}>
      <h2 style={{ color: '#FF9800', fontWeight: 700, marginBottom: 18 }}>{listing.title}</h2>
      {listing.images && listing.images.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
          {listing.images.map((img, idx) => (
            <img
              key={idx}
              src={`http://localhost:5000${img}`}
              alt={listing.title + ' image ' + (idx + 1)}
              style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 12, cursor: 'pointer', boxShadow: '0 2px 12px #455a6422' }}
              onClick={() => { setLightboxImg(`http://localhost:5000${img}`); setLightboxOpen(true); }}
            />
          ))}
        </div>
      )}
      {lightboxOpen && lightboxImg && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}
          onClick={() => setLightboxOpen(false)}
        >
          <img src={lightboxImg} alt="Large preview" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 4px 32px #0008' }} />
        </div>
      )}
      <div style={{ color: '#22223B', fontSize: '1.08em', marginBottom: 10 }}>{listing.description}</div>
      <div style={{ color: '#7B7F9E', fontSize: '1em', marginBottom: 10 }}>
        <b>Category:</b> {listing.category} &nbsp;|&nbsp; <b>Price:</b> {listing.price} {listing.priceUnit || ""} &nbsp;|&nbsp; <b>Location:</b> {listing.location}
      </div>
      <hr style={{ width: '100%', margin: '1.5em 0', border: 'none', borderTop: '1px solid #eee' }} />
      <h4 style={{ color: '#FF9800', marginBottom: 10 }}>Post a Review</h4>
      <form onSubmit={handleReviewSubmit} encType="multipart/form-data" style={{ width: '100%' }}>
        <label style={{ width: '100%' }}>
          Rating:
          <input
            type="number"
            name="rating"
            min="1"
            max="5"
            value={reviewForm.rating}
            onChange={handleReviewChange}
            required
            style={{ marginBottom: 10 }}
          />
        </label>
        <label style={{ width: '100%' }}>
          Comment:
          <textarea
            name="comment"
            value={reviewForm.comment}
            onChange={handleReviewChange}
            required
            style={{ marginBottom: 10 }}
          />
        </label>
        <input
          name="reviewImages"
          type="file"
          multiple
          accept="image/*"
          onChange={handleReviewImageChange}
          style={{ marginBottom: 10 }}
        />
        {reviewImageError && <div style={{ color: 'red', marginBottom: 8 }}>{reviewImageError}</div>}
        <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
          {reviewImagePreviews.map((src, idx) => (
            <img key={idx} src={src} alt="review preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
          ))}
        </div>
        <button type="submit" style={{ marginTop: 8 }}>Submit Review</button>
      </form>
      <div style={{ margin: '0.5em 0', color: '#FF9800', fontWeight: 500 }}>{reviewMsg}</div>
      <h3 style={{ color: '#FF9800', marginTop: 24 }}>Reviews</h3>
      {reviews.length === 0 && <div style={{ color: '#7B7F9E' }}>No reviews yet.</div>}
      <ul style={{ padding: 0, listStyle: 'none', width: '100%' }}>
        {reviews.map(r => (
          <li key={r._id} style={{ background: '#f7f7f7', borderRadius: 10, marginBottom: 12, padding: '1em 1em 0.7em 1em', boxShadow: '0 1px 6px #455a6411' }}>
            <b style={{ color: '#FF9800' }}>Rating:</b> {r.rating} &nbsp;|&nbsp; <b style={{ color: '#607D8B' }}>Comment:</b> {r.comment}
            {r.images && r.images.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {r.images.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                    alt={`review-img-${idx}`}
                    style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => setLightboxReviewImg(img.startsWith('http') ? img : `http://localhost:5000${img}`)}
                  />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
      {lightboxReviewImg && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}
          onClick={() => setLightboxReviewImg(null)}
        >
          <img src={lightboxReviewImg} alt="Large review preview" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 4px 32px #0008' }} />
        </div>
      )}
    </div>
  );
};

export default ListingDetails;