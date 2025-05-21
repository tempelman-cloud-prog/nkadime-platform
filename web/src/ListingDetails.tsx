import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getListings, getReviews, createReview, createRentalRequest, sendListingMessage, getListingMessages } from "./api";
import { getRentalHistory } from "./api";
import jwt_decode from "jwt-decode";
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

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
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const [reviewImageError, setReviewImageError] = useState("");
  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  const [rentalStart, setRentalStart] = useState("");
  const [rentalEnd, setRentalEnd] = useState("");
  const [rentalMsg, setRentalMsg] = useState("");
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [isOwner, setIsOwner] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [messageSuccess, setMessageSuccess] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
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
            // const completedRental = (rentals || []).find((r: any) => r.listing === found._id && r.status === "completed");
            // Check if already reviewed owner for this rental
            // const alreadyReviewed = (userReviews || []).some((rev: any) => rev.reviewer === userId && rev.rental === completedRental?._id);
          } catch {}
        }
      } catch (err) {
        setError('Failed to load listing details. Please try again.');
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  useEffect(() => {
    // Get current userId for messaging
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwt_decode<JwtPayload>(token);
        setCurrentUserId(decoded.userId || decoded.id || "");
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
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

  const openMessageDialog = async () => {
    setMessageDialogOpen(true);
    setMessageLoading(true);
    setMessageError("");
    try {
      const msgs = await getListingMessages(id!);
      setMessages(msgs);
    } catch (e: any) {
      setMessageError(e.message || "Failed to load messages");
    }
    setMessageLoading(false);
  };

  const handleSendMessage = async () => {
    setMessageLoading(true);
    setMessageError("");
    setMessageSuccess("");
    if (!newMessage.trim()) {
      setMessageError("Message cannot be empty");
      setMessageLoading(false);
      return;
    }
    try {
      const res = await sendListingMessage(id!, newMessage);
      if (res && !res.error) {
        setMessages([...messages, res]);
        setNewMessage("");
        setMessageSuccess("Message sent!");
      } else {
        setMessageError(res.error || "Failed to send message");
      }
    } catch (e: any) {
      setMessageError(e.message || "Failed to send message");
    }
    setMessageLoading(false);
  };

  if (loading) return (
    <div style={{ maxWidth: 820, margin: '3em auto', padding: '2.5em 2em' }}>
      <h2 style={{ textAlign: 'center', color: '#FF9800', fontWeight: 800, marginBottom: 18, fontSize: 32, letterSpacing: 0.5 }}>Listing Details</h2>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </div>
      {/* Skeleton for reviews */}
      <div style={{ marginTop: 32 }}>
        <div style={{ width: '40%', height: 28, background: '#f3f3f3', borderRadius: 8, margin: '0 auto 18px auto' }} />
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} style={{ background: '#f7f7f7', borderRadius: 10, margin: '0 auto 12px auto', padding: '1em', maxWidth: 600, boxShadow: '0 1px 6px #455a6411', opacity: 0.7 }}>
            <div style={{ width: '30%', height: 18, background: '#eee', borderRadius: 6, marginBottom: 8 }} />
            <div style={{ width: '80%', height: 16, background: '#eee', borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  if (!listing) return <div>Listing not found.</div>;

  return (
    <div className="modern-card" style={{
      maxWidth: 820,
      margin: '3em auto',
      padding: isLoggedIn ? '2.5em 2em' : '2.5em 0',
      background: isLoggedIn ? '#fff' : '#0a2342',
      borderRadius: 24,
      boxShadow: '0 8px 36px rgba(0,0,0,0.13)',
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      border: !isLoggedIn ? '3px solid #FF9800' : 'none',
    }}>
      <h2 style={{
        color: isLoggedIn ? '#FF9800' : '#FF9800',
        background: !isLoggedIn ? 'linear-gradient(90deg, #0a2342 0%, #FF9800 100%)' : 'none',
        WebkitBackgroundClip: !isLoggedIn ? 'text' : undefined,
        WebkitTextFillColor: !isLoggedIn ? 'transparent' : undefined,
        fontWeight: 900,
        marginBottom: 18,
        fontSize: 36,
        textAlign: 'center',
        letterSpacing: 1.2,
        textShadow: !isLoggedIn ? '0 2px 12px #0008' : undefined
      }}>{listing.title}</h2>
      {/* Show average rating */}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        {avgRating !== null && (
          <span style={{ fontSize: 22, color: '#FF9800', fontWeight: 800, background: !isLoggedIn ? '#fff2e0' : 'none', borderRadius: 8, padding: '4px 16px' }}>
            ★ {avgRating.toFixed(1)} / 5 ({ratingCount} review{ratingCount === 1 ? '' : 's'})
          </span>
        )}
      </div>
      {/* View Lister Profile button (always visible) */}
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <button
          style={{
            background: 'linear-gradient(90deg, #FF9800 0%, #0a2342 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 32px',
            fontWeight: 800,
            fontSize: 18,
            cursor: 'pointer',
            marginTop: 4,
            boxShadow: '0 2px 12px #0002',
            letterSpacing: 0.5
          }}
          onClick={() => {
            let ownerId = '';
            if (listing) {
              if (typeof listing.owner === 'object' && listing.owner && 'id' in listing.owner) {
                ownerId = (listing.owner as any).id;
              } else if (typeof listing.owner === 'object' && listing.owner && '_id' in listing.owner) {
                ownerId = (listing.owner as any)._id;
              } else {
                ownerId = listing.owner as string;
              }
              window.location.assign(`/profile/${ownerId}`);
            }
          }}
        >
          View Lister Profile
        </button>
      </div>
      {/* Images and info row */}
      <div style={{ display: 'flex', flexDirection: isLoggedIn ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
        {listing.images && listing.images.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {listing.images.map((img, idx) => (
              <img
                key={idx}
                src={`http://localhost:5000${img}`}
                alt={listing.title + ' image ' + (idx + 1)}
                style={{ width: 220, height: 220, objectFit: 'cover', borderRadius: 16, cursor: 'pointer', boxShadow: isLoggedIn ? '0 4px 20px #455a6422' : '0 4px 20px #000a', border: '2px solid #eee', transition: 'box-shadow 0.2s' }}
                tabIndex={0}
                aria-label={`Preview image ${idx + 1} of ${listing.title}`}
                onClick={() => { setLightboxImg(`http://localhost:5000${img}`); setLightboxOpen(true); }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setLightboxImg(`http://localhost:5000${img}`); setLightboxOpen(true); } }}
              />
            ))}
          </div>
        )}
        {/* Lightbox Dialog for image preview */}
        <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth="md" aria-label="Image preview dialog">
          <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#222' }}>
            {lightboxImg && (
              <img src={lightboxImg} alt="Preview" style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 12, boxShadow: '0 4px 32px #000a' }} />
            )}
          </DialogContent>
        </Dialog>
        {/* Only show action buttons if logged in */}
        {isLoggedIn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
            <button
              style={{
                background: '#607D8B', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 30px', fontWeight: 700, fontSize: 17, cursor: isOwner ? 'not-allowed' : 'pointer', opacity: isOwner ? 0.5 : 1, minWidth: 170
              }}
              onClick={() => !isOwner && openMessageDialog()}
              disabled={isOwner}
            >
              Contact Owner
            </button>
            <button
              style={{
                background: 'linear-gradient(90deg, #FF9800 0%, #FFB74D 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '12px 30px',
                fontWeight: 700,
                fontSize: 17,
                cursor: isOwner ? 'not-allowed' : 'pointer',
                opacity: isOwner ? 0.5 : 1,
                minWidth: 170
              }}
              onClick={() => !isOwner && setRentalModalOpen(true)}
              disabled={isOwner}
            >
              Request to Rent
            </button>
          </div>
        )}
        {/* For public users, show a call-to-action to log in if they try to interact */}
        {!isLoggedIn && (
          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(19,41,75,0.85)',
              border: '1.5px solid #FFB74D',
              borderRadius: 10,
              padding: '14px 28px',
              margin: '0 auto',
              color: '#FFB74D',
              fontWeight: 600,
              fontSize: 17,
              boxShadow: '0 2px 12px #0003',
              letterSpacing: 0.2
            }}>
              Log in to contact the owner or request to rent this item.
            </div>
          </div>
        )}
      </div>
      {/* Divider for public view */}
      {!isLoggedIn && (
        <div style={{ width: '90%', height: 2, background: 'linear-gradient(90deg, #0a2342 0%, #FFB74D 100%)', borderRadius: 2, margin: '32px auto 18px auto' }} />
      )}
      {/* Listing details for public */}
      <div style={{ color: isLoggedIn ? '#222' : '#fff', background: isLoggedIn ? 'transparent' : 'rgba(10,35,66,0.95)', borderRadius: 18, padding: isLoggedIn ? 0 : 28, marginBottom: 18, boxShadow: !isLoggedIn ? '0 2px 16px #0004' : undefined, width: !isLoggedIn ? '90%' : '100%', margin: !isLoggedIn ? '0 auto 18px auto' : '0 0 10px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, letterSpacing: 0.5 }}>{listing.category}</div>
        <div style={{ fontSize: 19, marginBottom: 8 }}><b>Location:</b> {listing.location}</div>
        <div style={{ fontSize: 19, marginBottom: 8 }}><b>Price:</b> {listing.price} {listing.priceUnit || 'per day'}</div>
        <div style={{ fontSize: 17, marginBottom: 8 }}><b>Description:</b> {listing.description}</div>
      </div>
      {/* Reviews section */}
      <h3 style={{ color: isLoggedIn ? '#FF9800' : '#FFB74D', marginTop: 24, marginBottom: 10, textAlign: !isLoggedIn ? 'center' : undefined, fontSize: 24, fontWeight: 700 }}>Reviews</h3>
      {reviews.length === 0 && <div style={{ color: isLoggedIn ? '#7B7F9E' : '#fff', textAlign: !isLoggedIn ? 'center' : undefined }}>No reviews yet.</div>}
      <ul style={{ padding: 0, listStyle: 'none', width: '100%', maxWidth: !isLoggedIn ? 600 : undefined, margin: !isLoggedIn ? '0 auto' : undefined }}>
        {reviews.map(r => (
          <li key={r._id} style={{ background: isLoggedIn ? '#f7f7f7' : '#13294b', borderRadius: 12, marginBottom: 14, padding: '1.1em 1.2em 0.8em 1.2em', boxShadow: isLoggedIn ? '0 1px 6px #455a6411' : '0 1px 8px #000a', color: isLoggedIn ? '#222' : '#fff', fontSize: 16 }}>
            <b style={{ color: isLoggedIn ? '#FF9800' : '#FFB74D' }}>Rating:</b> {r.rating} &nbsp;|&nbsp; <b style={{ color: isLoggedIn ? '#607D8B' : '#B0C4DE' }}>Comment:</b> {r.comment}
            {r.images && r.images.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {r.images.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                    alt={`review-img-${idx}`}
                    style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: !isLoggedIn ? '1.5px solid #FFB74D' : undefined }}
                  />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
      {/* Only show review form if logged in */}
      {isLoggedIn && (
        <>
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
        </>
      )}
      {/* Rental Modal and Message Modal only if logged in */}
      {isLoggedIn && rentalModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          tabIndex={-1}
          aria-modal="true"
          role="dialog"
          aria-label="Rental request dialog"
          onKeyDown={e => { if (e.key === 'Escape') setRentalModalOpen(false); }}
        >
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
                  // Notify the owner
                  await import('./api').then(api =>
                    api.createNotification(
                      listing.owner,
                      'rental_request',
                      `You have a new rental request for your listing '${listing.title}'.`,
                      { listingId: listing._id, rentalId: result._id }
                    )
                  );
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
      {isLoggedIn && messageDialogOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          tabIndex={-1}
          aria-modal="true"
          role="dialog"
          aria-label="Contact owner dialog"
          onKeyDown={e => { if (e.key === 'Escape') setMessageDialogOpen(false); }}
        >
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 340, maxWidth: 420, boxShadow: '0 8px 32px #0003', position: 'relative' }}>
            <h3 style={{ color: '#607D8B', marginBottom: 18 }}>Contact Owner</h3>
            <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 16 }}>
              {messageLoading ? (
                <div>Loading messages...</div>
              ) : (
                messages.length === 0 ? <div style={{ color: '#888' }}>No previous messages.</div> :
                  messages.map((msg, idx) => (
                    <div key={idx} style={{ marginBottom: 10, background: '#f7f7f7', borderRadius: 8, padding: 8 }}>
                      <b style={{ color: msg.sender === currentUserId ? '#FF9800' : '#607D8B' }}>{msg.sender === currentUserId ? 'You' : 'Owner'}:</b> {msg.text}
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}</div>
                    </div>
                  ))
              )}
              {messageError && <div style={{ color: 'red', marginTop: 8 }}>{messageError}</div>}
              {messageSuccess && <div style={{ color: 'green', marginTop: 8 }}>{messageSuccess}</div>}
            </div>
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              style={{ width: '100%', minHeight: 60, borderRadius: 8, border: '1px solid #ccc', padding: 8, marginBottom: 10 }}
              disabled={messageLoading}
              aria-label="Type your message"
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                style={{ background: '#607D8B', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
                onClick={handleSendMessage}
                disabled={messageLoading || !newMessage.trim()}
                aria-label="Send message"
              >
                Send
              </button>
              <button
                style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
                onClick={() => setMessageDialogOpen(false)}
                aria-label="Close message dialog"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetails;