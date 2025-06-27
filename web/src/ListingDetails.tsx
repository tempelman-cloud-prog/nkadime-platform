import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getListings, getReviews, createReview, createRentalRequest, getListingMessages, sendListingMessage } from "./api";
import { getRentalHistory } from "./api";
import jwt_decode from "jwt-decode";
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useMessages, useConversations } from './MessagesContext';

const API_BASE = process.env.REACT_APP_API_BASE || "https://nkadime-platform.onrender.com/api";

// Helper to handle both relative and absolute URLs
function getImageUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url}`;
}

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
  status: 'available' | 'pending approval' | 'unavailable';
  deleted?: boolean;
}

interface JwtPayload {
  userId?: string;
  id?: string;
  email?: string;
  name?: string;
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
  const [rentalStartTime, setRentalStartTime] = useState("");
  const [rentalEndTime, setRentalEndTime] = useState("");
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
  const [rentalTotal, setRentalTotal] = useState<number | null>(null);

  const { sendMessage, subscribe } = useMessages();
  const { setConversations } = useConversations();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const allListings = await getListings();
        const found = (allListings.listings || []).find((l: Listing) => l._id === id);
        if (found && found.deleted === true) {
          setListing(null);
        } else {
          setListing(found || null);
        }
        const revs = await getReviews(id!);
        setReviews(revs);
        setLoading(false);
        if (id) {
          const res = await fetch(`${API_BASE}/average-rating/listing/${id}`);
          const data = await res.json();
          setAvgRating(data.avg);
          setRatingCount(data.count);
        }
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
          try {
            await getRentalHistory(userId);
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

  useEffect(() => {
    if (!messageDialogOpen) return;
    const unsub = subscribe((msg) => {
      if (msg.conversationId === id || msg.toUser === currentUserId || msg.fromUser === currentUserId) {
        setMessages(prev => [...prev, msg]);
      }
    });
    return unsub;
  }, [messageDialogOpen, id, currentUserId, subscribe]);

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
      setMessages(Array.isArray(msgs) ? msgs : msgs.messages || []);
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
    let recipientId = '';
    let ownerId = '';
    if (listing) {
      if (typeof listing.owner === 'object' && listing.owner && 'id' in listing.owner) {
        ownerId = (listing.owner as any).id;
      } else if (typeof listing.owner === 'object' && listing.owner && '_id' in listing.owner) {
        ownerId = (listing.owner as any)._id;
      } else {
        ownerId = listing.owner as string;
      }
    }
    if (currentUserId === ownerId) {
      const lastMsg = [...messages].reverse().find(m => {
        const senderId = m.sender || (m.fromUser?._id || m.fromUser?.id || m.fromUser);
        return senderId !== ownerId;
      });
      if (lastMsg) {
        recipientId = lastMsg.sender || (lastMsg.fromUser?._id || lastMsg.fromUser?.id || lastMsg.fromUser);
      } else {
        setMessageError("No recipient found to reply to.");
        setMessageLoading(false);
        return;
      }
      if (recipientId === ownerId) {
        setMessageError("You cannot message yourself.");
        setMessageLoading(false);
        return;
      }
    } else {
      recipientId = ownerId;
      if (recipientId === currentUserId) {
        setMessageError("You cannot message yourself.");
        setMessageLoading(false);
        return;
      }
    }
    try {
      // Persist message to backend
      const savedMsg = await sendListingMessage(id!, newMessage, recipientId);
      // Broadcast via WebSocket for real-time update
      sendMessage({
        fromUser: savedMsg.fromUser?._id || savedMsg.fromUser,
        toUser: savedMsg.toUser?._id || savedMsg.toUser,
        message: savedMsg.message,
        conversationId: savedMsg.listing?._id || savedMsg.listing || id
      });
      const newMsg = {
        _id: savedMsg._id || `msg-${Date.now()}`,
        fromUser: savedMsg.fromUser,
        toUser: savedMsg.toUser,
        message: savedMsg.message,
        createdAt: savedMsg.createdAt || new Date().toISOString(),
        conversationId: savedMsg.listing?._id || savedMsg.listing || id
      };
      setMessages([...messages, newMsg]);
      // Update conversations state for navbar/messages page
      setConversations(prev => {
        // Try to find existing conversation for this listing and user
        const existing = prev.find(conv => conv._id === id);
        // Get current user ID
        const token = localStorage.getItem('token');
        let currentUserId = '';
        if (token) {
          try {
            const decoded: any = JSON.parse(atob(token.split('.')[1]));
            currentUserId = decoded.userId || decoded.id || '';
          } catch {}
        }
        // The other user is the one who is NOT the current user
        let otherUser: any;
        if (newMsg.fromUser === currentUserId) {
          otherUser = newMsg.toUser;
        } else {
          otherUser = newMsg.fromUser;
        }
        if (typeof otherUser === 'string') {
          otherUser = { _id: otherUser };
        }
        if (existing) {
          return prev.map(conv =>
            conv._id === id
              ? { ...conv, message: newMessage, unreadCount: 0, updatedAt: new Date().toISOString(), thread: [...(conv.thread || []), newMsg], listing, fromUser: otherUser }
              : conv
          );
        } else {
          // Add new conversation
          return [
            {
              _id: id,
              message: newMessage,
              unreadCount: 0,
              updatedAt: new Date().toISOString(),
              thread: [newMsg],
              listing,
              fromUser: otherUser
            },
            ...prev
          ];
        }
      });
      setNewMessage("");
      setMessageSuccess("Message sent!");
      setTimeout(() => {
        const dialog = document.querySelector('[aria-label="Messages chat window"] > div[aria-live="polite"]');
        if (dialog) {
          dialog.scrollTop = dialog.scrollHeight;
        }
      }, 100);
    } catch (e) {
      setMessageError("Failed to send message");
    }
    setMessageLoading(false);
  };

  useEffect(() => {
    if (!listing || !rentalStart || !rentalEnd || !rentalStartTime || !rentalEndTime) {
      setRentalTotal(null);
      return;
    }
    const start = new Date(rentalStart + 'T' + rentalStartTime);
    const end = new Date(rentalEnd + 'T' + rentalEndTime);
    if (end <= start) {
      setRentalTotal(null);
      return;
    }
    const ms = end.getTime() - start.getTime();
    const hours = ms / (1000 * 60 * 60);
    const pricePerHour = listing.price;
    setRentalTotal(Math.round(hours * pricePerHour * 100) / 100);
  }, [listing, rentalStart, rentalEnd, rentalStartTime, rentalEndTime]);

  useEffect(() => {
    if (listing && listing.deleted === true) {
      setListing(null);
    }
  }, [listing]);

  const isCurrentUserOwner = () => {
    if (!listing || !currentUserId) return false;
    if (typeof listing.owner === 'object' && listing.owner) {
      const ownerObj = listing.owner as any;
      return ownerObj._id === currentUserId || ownerObj.id === currentUserId;
    }
    return listing.owner === currentUserId;
  };

  async function initiatePayment({ ownerId, amount, renterEmail, renterName }: { ownerId: string, amount: number, renterEmail: string, renterName: string }) {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <CircularProgress />
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
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        {avgRating !== null && (
          <span style={{ fontSize: 22, color: '#FF9800', fontWeight: 800, background: !isLoggedIn ? '#fff2e0' : 'none', borderRadius: 8, padding: '4px 16px' }}>
            ★ {avgRating.toFixed(1)} / 5 ({ratingCount} review{ratingCount === 1 ? '' : 's'})
          </span>
        )}
      </div>
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
      <div style={{ display: 'flex', flexDirection: isLoggedIn ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
        {listing.images && listing.images.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {listing.images.map((img, idx) => (
              <img
                key={idx}
                src={getImageUrl(img)}
                alt={listing.title + ' image ' + (idx + 1)}
                style={{ width: 220, height: 220, objectFit: 'cover', borderRadius: 16, cursor: 'pointer', boxShadow: isLoggedIn ? '0 4px 20px #455a6422' : '0 4px 20px #000a', border: '2px solid #eee', transition: 'box-shadow 0.2s' }}
                tabIndex={0}
                aria-label={`Preview image ${idx + 1} of ${listing.title}`}
                onClick={() => { setLightboxImg(getImageUrl(img)); setLightboxOpen(true); }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setLightboxImg(getImageUrl(img)); setLightboxOpen(true); } }}
              />
            ))}
          </div>
        )}
        <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth="md" aria-label="Image preview dialog">
          <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#222' }}>
            {lightboxImg && (
              <img src={lightboxImg} alt="Preview" style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 12, boxShadow: '0 4px 32px #000a' }} />
            )}
          </DialogContent>
        </Dialog>
        {isLoggedIn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
            <button
              style={{
                background: '#607D8B', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 30px', fontWeight: 700, fontSize: 17, cursor: isCurrentUserOwner() ? 'not-allowed' : 'pointer', opacity: isCurrentUserOwner() ? 0.5 : 1, minWidth: 170
              }}
              onClick={() => !isCurrentUserOwner() && openMessageDialog()}
              disabled={isCurrentUserOwner()}
              aria-disabled={isCurrentUserOwner()}
              title={isCurrentUserOwner() ? 'You cannot contact yourself.' : 'Contact the owner'}
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
                cursor: isCurrentUserOwner() ? 'not-allowed' : 'pointer',
                opacity: isCurrentUserOwner() ? 0.5 : 1,
                minWidth: 170
              }}
              onClick={() => !isCurrentUserOwner() && setRentalModalOpen(true)}
              disabled={isCurrentUserOwner()}
              aria-disabled={isCurrentUserOwner()}
              title={isCurrentUserOwner() ? 'You cannot rent your own listing.' : 'Request to rent this item'}
            >
              Request to Rent
            </button>
          </div>
        )}
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
      {!isLoggedIn && (
        <div style={{ width: '90%', height: 2, background: 'linear-gradient(90deg, #0a2342 0%, #FFB74D 100%)', borderRadius: 2, margin: '32px auto 18px auto' }} />
      )}
      <div style={{ color: isLoggedIn ? '#222' : '#fff', background: isLoggedIn ? 'transparent' : 'rgba(10,35,66,0.95)', borderRadius: 18, padding: isLoggedIn ? 0 : 28, marginBottom: 18, boxShadow: !isLoggedIn ? '0 2px 16px #0004' : undefined, width: !isLoggedIn ? '90%' : '100%', margin: !isLoggedIn ? '0 auto 18px auto' : '0 0 10px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, letterSpacing: 0.5 }}>{listing.category}</div>
        <div style={{ fontSize: 19, marginBottom: 8 }}><b>Location:</b> {listing.location}</div>
        <div style={{ fontSize: 19, marginBottom: 8 }}><b>Price:</b> {listing.price} {listing.priceUnit || 'per day'}</div>
        <div style={{ fontSize: 17, marginBottom: 8 }}><b>Description:</b> {listing.description}</div>
      </div>
      <h3 style={{ color: isLoggedIn ? '#FF9800' : '#FFB74D', marginTop: 24, marginBottom: 10, textAlign: !isLoggedIn ? 'center' : undefined, fontSize: 24, fontWeight: 700 }}>Reviews</h3>
      {reviews.length === 0 && <div style={{ color: isLoggedIn ? '#7B7F9E' : '#fff', textAlign: !isLoggedIn ? 'center' : undefined }}>No reviews yet.</div>}
      <ul style={{ padding: 0, listStyle: 'none', width: '100%', maxWidth: !isLoggedIn ? 600 : undefined, margin: !isLoggedIn ? '0 auto' : undefined }}>
        {reviews.map(r => (
          <li key={r._id} style={{ background: isLoggedIn ? '#f7f7f7' : '#13294b', borderRadius: 12, marginBottom: 14, padding: '1.1em 1.2em 0.8em 1.2em', boxShadow: isLoggedIn ? '0 1px 6px #455a6411' : '0 1px 8px #000a', color: isLoggedIn ? '#222' : '#fff', fontSize: 16 }}>
            <b style={{ color: isLoggedIn ? '#FF9800' : '#FFB74D' }}>Rating:</b> {r.rating}  |  <b style={{ color: isLoggedIn ? '#607D8B' : '#B0C4DE' }}>Comment:</b> {r.comment}
            {r.images && r.images.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {r.images.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={getImageUrl(img)}
                    alt={`review-img-${idx}`}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => { setLightboxImg(getImageUrl(img)); setLightboxOpen(true); }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setLightboxImg(getImageUrl(img)); setLightboxOpen(true); } }}
                  />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
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
                  style={{ marginBottom: 10, minHeight: 90, padding: '14px 12px', fontSize: 16 }}
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
              <input type="time" value={rentalStartTime} onChange={e => setRentalStartTime(e.target.value)} style={{ marginLeft: 8, padding: 6, borderRadius: 6, border: '1px solid #ccc', width: 120 }} />
            </label>
            <label style={{ display: 'block', marginBottom: 18 }}>
              End Date:
              <input type="date" value={rentalEnd} onChange={e => setRentalEnd(e.target.value)} style={{ marginLeft: 8, padding: 6, borderRadius: 6, border: '1px solid #ccc' }} />
              <input type="time" value={rentalEndTime} onChange={e => setRentalEndTime(e.target.value)} style={{ marginLeft: 8, padding: 6, borderRadius: 6, border: '1px solid #ccc', width: 120 }} />
            </label>
            <div style={{ marginBottom: 16, fontWeight: 700, color: '#0a2342', fontSize: 17 }}>
              {rentalTotal !== null ? `Total Charge: ${rentalTotal} (${listing?.price} per hour)` : 'Select start and end date/time to see total charge.'}
            </div>
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
                  const decoded: any = jwt_decode(token);
                  renter = decoded.userId || decoded.id || "";
                } catch {
                  setRentalMsg("Invalid token.");
                  return;
                }
                if (isOwner) {
                  setRentalMsg("You cannot request to rent your own listing.");
                  return;
                }
                if (!rentalStart || !rentalEnd) {
                  setRentalMsg("Please select start and end dates.");
                  return;
                }
                const startDateTime = rentalStart + (rentalStartTime ? `T${rentalStartTime}` : 'T00:00');
                const endDateTime = rentalEnd + (rentalEndTime ? `T${rentalEndTime}` : 'T23:59');
                if (new Date(endDateTime) < new Date(startDateTime)) {
                  setRentalMsg("End date/time must be after start date/time.");
                  return;
                }
                const result = await createRentalRequest({
                  listing: listing!._id,
                  renter,
                  owner: listing!.owner,
                  startDate: startDateTime,
                  endDate: endDateTime,
                });
                if (result.success || result._id) {
                  setRentalMsg('Rental request sent! Redirecting to payment...');
                  setRentalModalOpen(false);
                  const token = localStorage.getItem("token");
                  let renterEmail = "", renterName = "";
                  if (token) {
                    try {
                      const decoded = jwt_decode<JwtPayload>(token);
                      renterEmail = decoded.email || "";
                      renterName = decoded.name || "";
                    } catch {}
                  }
                  await initiatePayment({
                    ownerId: listing.owner,
                    amount: rentalTotal!,
                    renterEmail,
                    renterName
                  });
                  window.location.assign('/dashboard');
                } else {
                  setRentalMsg(result.error || "Failed to send rental request");
                }
              }}
            >
              Confirm and Pay
            </button>
            <button
              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#FF9800' }}
              onClick={() => setRentalModalOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            {rentalMsg && (
              <div style={{ marginTop: 16, color: rentalMsg.includes('Failed') ? 'red' : 'green', fontWeight: 500 }}>
                {rentalMsg}
              </div>
            )}
          </div>
        </div>
      )}
      {isLoggedIn && messageDialogOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.7)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 0.3s ease-in-out'
        }}
          tabIndex={-1}
          aria-modal="true"
          role="dialog"
          aria-label="Messages chat window"
          onKeyDown={e => { if (e.key === 'Escape') setMessageDialogOpen(false); }}
        >
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            padding: 0,
            minWidth: 360,
            maxWidth: 480,
            width: '90%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: '80vh',
            transition: 'transform 0.3s ease-in-out',
            transform: 'scale(1)',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(90deg, #FF8C00 0%, #FFA726 100%)',
              color: '#ffffff',
              padding: '20px 24px',
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: 0.3,
              textAlign: 'center',
              borderBottom: '2px solid #FFE082',
              position: 'relative',
            }}>
              Messages
              <button
                style={{
                  position: 'absolute',
                  top: 18,
                  right: 20,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 24,
                  color: '#ffffff',
                  fontWeight: 600,
                  transition: 'color 0.2s',
                }}
                onClick={() => setMessageDialogOpen(false)}
                aria-label="Close messages dialog"
                onMouseOver={e => e.currentTarget.style.color = '#FFE082'}
                onMouseOut={e => e.currentTarget.style.color = '#ffffff'}
              >
                ×
              </button>
            </div>
            {/* Messages List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              background: '#f8fafc',
              padding: '20px 20px 16px',
              minHeight: 200,
              maxHeight: 400,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              scrollbarWidth: 'thin',
              scrollbarColor: '#FFB300 #f8fafc',
            }}
              aria-live="polite"
            >
              {messageLoading && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 60 }}>
                  <CircularProgress size={28} sx={{ color: '#FF9800' }} />
                </div>
              )}
              {!messageLoading && messages.length === 0 && null}
              {messages.map((msg, idx) => {
                const isMe = msg.fromUser === currentUserId;
                return (
                  <div key={msg._id + '-' + idx} style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    background: isMe ? '#e3f2fd' : '#fff3e0',
                    color: '#1e293b',
                    borderRadius: 16,
                    padding: '12px 18px',
                    maxWidth: '75%',
                    minWidth: 80,
                    fontSize: 16,
                    boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                    border: isMe ? '1px solid #bbdefb' : '1px solid #ffe0b2',
                    marginBottom: 4,
                    transition: 'transform 0.2s',
                    position: 'relative',
                  }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14, color: isMe ? '#1976d2' : '#e65100' }}>
                      {isMe ? 'You' : 'Owner'}
                    </div>
                    <div style={{ fontSize: 16, lineHeight: '1.4', marginBottom: 6 }}>{msg.message}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'right', opacity: 0.8 }}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Input Row */}
            <div style={{
              background: '#ffffff',
              borderTop: '2px solid #FFE082',
              padding: '16px 20px',
              minHeight: 80,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              flex: 1,
              justifyContent: 'flex-end',
            }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #e2e8f0',
                    fontSize: 16,
                    outline: 'none',
                    background: '#f9fafb',
                    color: '#1e293b',
                    minHeight: 120,
                    maxHeight: 200,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    flex: 1,
                  }}
                  aria-label="New message input"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && newMessage.trim()) {
                      e.preventDefault();
                      if (!messageLoading) handleSendMessage();
                    }
                  }}
                  disabled={messageLoading}
                  onFocus={e => {
                    e.target.style.borderColor = '#FF9800';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255,152,0,0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <button
                onClick={() => { if (!messageLoading) handleSendMessage(); }}
                style={{
                  background: 'linear-gradient(90deg, #FF8C00 0%, #FFA726 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 24px',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: messageLoading || !newMessage.trim() ? 'not-allowed' : 'pointer',
                  minWidth: 100,
                  transition: 'background 0.3s, transform 0.2s, opacity 0.2s',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  opacity: messageLoading || !newMessage.trim() ? 0.6 : 1,
                  alignSelf: 'flex-end',
                  marginTop: 10,
                }}
                aria-label="Send message"
                disabled={messageLoading || !newMessage.trim()}
                onMouseOver={e => {
                  if (!messageLoading && newMessage.trim()) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {messageLoading ? <CircularProgress size={20} color="inherit" /> : 'Send'}
              </button>
              {(messageError || messageSuccess) && (
                <div style={{
                  padding: '10px 20px',
                  color: messageError ? '#dc2626' : '#16a34a',
                  fontWeight: 500,
                  fontSize: 14,
                  background: '#f8fafc',
                  borderTop: '1px solid #e5e7eb',
                  textAlign: 'center',
                  transition: 'opacity 0.3s',
                }}>
                  {messageError || messageSuccess}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetails;