import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getListings, getReviews, createReview, createRentalRequest } from "./api";
import { getRentalHistory } from "./api";
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
  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  const [rentalStart, setRentalStart] = useState("");
  const [rentalEnd, setRentalEnd] = useState("");
  const [rentalMsg, setRentalMsg] = useState("");
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [ownerReviewForm, setOwnerReviewForm] = useState({ rating: 5, comment: "" });
  const [ownerReviewMsg, setOwnerReviewMsg] = useState("");
  const [canReviewOwner, setCanReviewOwner] = useState(false);
  const [hasReviewedOwner, setHasReviewedOwner] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const allListings = await getListings();
      const found = (allListings.listings || []).find((l: Listing) => l._id === id);
      setListing(found || null);
      const revs = await getReviews(id!);
      setReviews(revs);
      setLoading(false);
      if (id) {
        // Fetch average rating for this listing
        const res = await fetch(`http://localhost:5000/api/average-rating/listing/${id}`);
        const data = await res.json();
        setAvgRating(data.avg);
        setRatingCount(data.count);
      }
      // Check if user can review owner (completed rental)
      const token = localStorage.getItem("token");
      let userId = "";
      if (token) {
        try {
          const decoded = jwt_decode<JwtPayload>(token);
          userId = decoded.userId || decoded.id || "";
        } catch {}
      }
      if (userId && found) {
        setIsOwner(userId === found.owner);
        // Fetch rental history for this user and listing
        try {
          const rentals = await getRentalHistory(userId);
          const completedRental = (rentals || []).find((r: any) => r.listing === found._id && r.status === "completed");
          setCanReviewOwner(!!completedRental);
          // Check if already reviewed owner for this rental
          const userReviews = await fetch(`http://localhost:5000/api/reviews/user/${found.owner}`).then(r=>r.json());
          const alreadyReviewed = (userReviews || []).some((rev: any) => rev.reviewer === userId && rev.rental === completedRental?._id);
          setHasReviewedOwner(alreadyReviewed);
        } catch {}
      }
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

  const handleOwnerReviewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setOwnerReviewForm({ ...ownerReviewForm, [e.target.name]: e.target.value });
  };

  const handleOwnerReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerReviewMsg("");
    const token = localStorage.getItem("token");
    if (!token) {
      setOwnerReviewMsg("You must be logged in to post a review.");
      return;
    }
    let reviewer = "";
    try {
      const decoded = jwt_decode<JwtPayload>(token);
      reviewer = decoded.userId || decoded.id || "";
    } catch {
      setOwnerReviewMsg("Invalid token.");
      return;
    }
    // Find completed rental for this listing
    const rentals = await getRentalHistory(reviewer);
    const completedRental = (rentals || []).find((r: any) => r.listing === listing?._id && r.status === "completed");
    if (!completedRental) {
      setOwnerReviewMsg("No completed rental found for this listing.");
      return;
    }
    // Submit review for owner
    const result = await createReview({
      reviewedUser: listing?.owner,
      reviewer,
      rating: Number(ownerReviewForm.rating),
      comment: ownerReviewForm.comment,
      rental: completedRental._id,
      images: []
    });
    if (result._id) {
      setOwnerReviewMsg("Review posted!");
      setHasReviewedOwner(true);
      setOwnerReviewForm({ rating: 5, comment: "" });
    } else {
      setOwnerReviewMsg(result.error || "Failed to post review");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!listing) return <div>Listing not found.</div>;

  return (
    <div className="modern-card" style={{
      maxWidth: 820,
      margin: '3em auto',
      padding: '2.5em 2em',
      background: '#fff',
      borderRadius: 20,
      boxShadow: '0 8px 36px rgba(0,0,0,0.13)',
      display: 'flex',
      flexDirection: 'column',
      gap: 28
    }}>
      <h2 style={{ color: '#FF9800', fontWeight: 800, marginBottom: 18, fontSize: 32, textAlign: 'center', letterSpacing: 0.5 }}>{listing.title}</h2>
      {/* Show average rating */}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        {avgRating !== null && (
          <span style={{ fontSize: 20, color: '#607D8B', fontWeight: 700 }}>
            ★ {avgRating.toFixed(1)} / 5 ({ratingCount} review{ratingCount === 1 ? '' : 's'})
          </span>
        )}
      </div>
      {listing.images && listing.images.length > 0 && (
        <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {listing.images.map((img, idx) => (
            <img
              key={idx}
              src={`http://localhost:5000${img}`}
              alt={listing.title + ' image ' + (idx + 1)}
              style={{ width: 220, height: 220, objectFit: 'cover', borderRadius: 16, cursor: 'pointer', boxShadow: '0 4px 20px #455a6422', border: '2px solid #eee', transition: 'box-shadow 0.2s' }}
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
      <div style={{ fontSize: 18, color: '#444', marginBottom: 10, fontWeight: 600, display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ background: '#FFF3E0', color: '#FF9800', borderRadius: 8, padding: '4px 16px', fontWeight: 700, fontSize: 16 }}>{listing.category}</span>
        <span style={{ color: '#388E3C', fontWeight: 700 }}>{listing.price} {listing.priceUnit || ''}</span>
        <span style={{ color: '#888' }}><em>Location:</em> {listing.location}</span>
        <span style={{ background: listing.available !== false ? '#C8E6C9' : '#FFCDD2', color: listing.available !== false ? '#388E3C' : '#C62828', borderRadius: 8, padding: '4px 16px', fontWeight: 700, fontSize: 16 }}>{listing.available !== false ? 'Available' : 'Unavailable'}</span>
      </div>
      <div style={{ fontSize: 18, color: '#333', marginBottom: 18, lineHeight: 1.6, background: '#f9f9f9', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px #0001' }}>{listing.description}</div>
      <hr style={{ width: '100%', margin: '1.5em 0', border: 'none', borderTop: '1px solid #eee' }} />
      <h4 style={{ color: '#FF9800', marginBottom: 10 }}>Post a Review</h4>
      {isOwner ? (
        <div style={{ color: 'red', marginBottom: 12 }}>You cannot review your own listing.</div>
      ) : (
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
      )}
      <div style={{ margin: '0.5em 0', color: '#FF9800', fontWeight: 500 }}>{reviewMsg}</div>
      {listing.available !== false && (
        <button
          style={{
            background: 'linear-gradient(90deg, #FF9800 0%, #FFB74D 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 30px',
            fontWeight: 700,
            fontSize: 19,
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            cursor: 'pointer',
            margin: '10px 0',
            transition: 'background 0.2s, box-shadow 0.2s',
            letterSpacing: 0.5,
            width: 'fit-content',
            alignSelf: 'center',
            display: 'block',
          }}
          onClick={() => setRentalModalOpen(true)}
        >
          Request to Rent
        </button>
      )}
      {/* Rental Modal */}
      {rentalModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 320, boxShadow: '0 8px 32px #0003', position: 'relative' }}>
            <h3 style={{ color: '#FF9800', marginBottom: 18 }}>Request to Rent</h3>
            <label style={{ display: 'block', marginBottom: 12 }}>
              Start Date:
              <input type="date" value={rentalStart} onChange={e => setRentalStart(e.target.value)} style={{ marginLeft: 8, padding: 6, borderRadius: 6, border: '1px solid #ccc' }} />
            </label>
            <label style={{ display: 'block', marginBottom: 18 }}>
              End Date:
              <input type="date" value={rentalEnd} onChange={e => setRentalEnd(e.target.value)} style={{ marginLeft: 8, padding: 6, borderRadius: 6, border: '1px solid #ccc' }} />
            </label>
            <button
              style={{ background: '#FF9800', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 17, marginRight: 10, cursor: 'pointer' }}
              onClick={async () => {
                setRentalMsg("");
                const token = localStorage.getItem("token");
                if (!token) {
                  setRentalMsg("You must be logged in to request a rental.");
                  return;
                }
                let renter = "";
                try {
                  const decoded: any = jwt_decode(token); // Fix: type as any
                  renter = decoded.userId || decoded.id || "";
                } catch {
                  setRentalMsg("Invalid token.");
                  return;
                }
                if (!rentalStart || !rentalEnd) {
                  setRentalMsg("Please select start and end dates.");
                  return;
                }
                if (new Date(rentalEnd) < new Date(rentalStart)) {
                  setRentalMsg("End date must be after start date.");
                  return;
                }
                const result = await createRentalRequest({
                  listing: listing._id,
                  renter,
                  owner: listing.owner,
                  startDate: rentalStart,
                  endDate: rentalEnd,
                });
                if (result._id) {
                  setRentalMsg("Rental request sent!");
                  setTimeout(() => setRentalModalOpen(false), 1200);
                } else {
                  setRentalMsg(result.error || "Failed to request rental");
                }
              }}
            >
              Send Request
            </button>
            <button
              style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 17, marginLeft: 10, cursor: 'pointer' }}
              onClick={() => setRentalModalOpen(false)}
            >
              Cancel
            </button>
            <div style={{ minHeight: 24, color: rentalMsg.includes('error') ? 'red' : '#333', marginTop: 12, textAlign: 'center', fontSize: 15 }}>{rentalMsg}</div>
          </div>
        </div>
      )}
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
      {/* Owner Review Prompt (if eligible) */}
      {canReviewOwner && !hasReviewedOwner && !isOwner && (
        <div style={{ background: '#FFF8E1', borderRadius: 12, padding: 18, margin: '18px 0', boxShadow: '0 1px 6px #FF980033' }}>
          <h4 style={{ color: '#FF9800', marginBottom: 10 }}>Review the Owner</h4>
          <form onSubmit={handleOwnerReviewSubmit} style={{ width: '100%' }}>
            <label style={{ width: '100%' }}>
              Rating:
              <input
                type="number"
                name="rating"
                min="1"
                max="5"
                value={ownerReviewForm.rating}
                onChange={handleOwnerReviewChange}
                required
                style={{ marginBottom: 10 }}
              />
            </label>
            <label style={{ width: '100%' }}>
              Comment:
              <textarea
                name="comment"
                value={ownerReviewForm.comment}
                onChange={handleOwnerReviewChange}
                required
                style={{ marginBottom: 10 }}
              />
            </label>
            <button type="submit" style={{ marginTop: 8 }}>Submit Owner Review</button>
          </form>
          <div style={{ margin: '0.5em 0', color: '#FF9800', fontWeight: 500 }}>{ownerReviewMsg}</div>
        </div>
      )}
      {canReviewOwner && !hasReviewedOwner && isOwner && (
        <div style={{ background: '#FFF8E1', borderRadius: 12, padding: 18, margin: '18px 0', boxShadow: '0 1px 6px #FF980033', color: 'red', fontWeight: 600 }}>
          You cannot review yourself as the owner.
        </div>
      )}
    </div>
  );
};

export default ListingDetails;