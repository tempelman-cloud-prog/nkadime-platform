import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Rating from "@mui/material/Rating";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { getListings, getReviews, updateUser, updateRentalStatus, getUserReviews, getUserAverageRating } from "./api";
import jwt_decode from "jwt-decode";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface JwtPayload {
  userId?: string;
  id?: string;
  email?: string;
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

interface Review {
  _id: string;
  reviewer: string;
  rating: number;
  comment: string;
  createdAt: string;
  listing: string;
}

const Profile: React.FC = () => {
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState<string>("");
  const [joinDate, setJoinDate] = useState<string>("");
  const [editMode, setEditMode] = useState(false);
  const [profilePic, setProfilePic] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [tempName, setTempName] = useState("");
  const [tempLocation, setTempLocation] = useState("");
  const [tempProfilePic, setTempProfilePic] = useState<string | undefined>(undefined);
  const [tempBio, setTempBio] = useState("");
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [rentalHistory, setRentalHistory] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [userAvgRating, setUserAvgRating] = useState<number | null>(null);
  const [userRatingCount, setUserRatingCount] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to view your profile.");
      setLoading(false);
      return;
    }
    try {
      const decoded = jwt_decode<JwtPayload & { name?: string; createdAt?: string }>(token);
      const uid = decoded.userId || decoded.id || "";
      setUserId(uid);
      setEmail(decoded.email || "");
      setName(decoded.name || "User");
      if (decoded.createdAt) {
        setJoinDate(new Date(decoded.createdAt).toLocaleDateString());
      }
      // Fetch user profile from backend for location and profilePic
      const fetchData = async () => {
        const userRes = await fetch(`http://localhost:5000/api/users/${uid}`);
        const userData = await userRes.json();
        setLocation(userData.location || "");
        setProfilePic(userData.profilePic || undefined);
        setBio(userData.bio || "");
        const allListings = await getListings();
        setListings((allListings.listings || []).filter((l: Listing) => l.owner === uid));
        // Fetch user reviews and average rating
        const userRevs = await getUserReviews(uid);
        setUserReviews(userRevs);
        const avgData = await getUserAverageRating(uid);
        setUserAvgRating(avgData.avg);
        setUserRatingCount(avgData.count);
        // Fetch rental history
        const rentals = await import('./api').then(api => api.getRentalHistory(uid));
        setRentalHistory(rentals);
        setLoading(false);
      };
      fetchData();
    } catch (e) {
      setError("Invalid token. Please log in again.");
      setLoading(false);
    }
  }, []);

  // Calculate average rating
  const avgRating = reviews.length
    ? (
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      ).toFixed(1)
    : null;

  const handleEdit = () => {
    setTempName(name);
    setTempLocation(location);
    setTempProfilePic(profilePic);
    setTempBio(bio);
    setEditMode(true);
    setSaveMessage(""); // Clear any previous save message
  };

  const handleCancel = () => {
    setEditMode(false);
    setTempName(name);
    setTempLocation(location);
    setTempProfilePic(profilePic);
    setTempBio(bio);
    setProfilePicFile(null);
    setSaveMessage(""); // Clear any previous save message
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage("");
    try {
      const result = await updateUser(userId, {
        name: tempName,
        location: tempLocation,
        profilePic: profilePicFile,
        bio: tempBio,
      });
      setSaving(false);
      if (result && !result.error) {
        setName(result.name);
        setLocation(result.location);
        setProfilePic(result.profilePic);
        setBio(result.bio || "");
        setEditMode(false);
        setProfilePicFile(null);
        setSaveMessage("Profile updated successfully!");
      } else {
        setSaveMessage(result.error || "Failed to update profile");
      }
    } catch (err) {
      setSaving(false);
      setSaveMessage("Failed to update profile");
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setTempProfilePic(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddListing = () => {
    navigate("/create-listing");
  };

  const handleRentalStatus = async (rentalId: string, status: string) => {
    const result = await updateRentalStatus(rentalId, status);
    if (result && !result.error) {
      setRentalHistory(rentalHistory.map(r => r._id === rentalId ? result : r));
    } else {
      alert(result.error || 'Failed to update rental status');
    }
  };

  // Helper for marker icon (Leaflet default icon fix)
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  });

  // TODO: Run `npm i --save-dev @types/leaflet` to fix missing types for 'leaflet'.

  function LocationMarker() {
    useMapEvents({
      click(e: L.LeafletMouseEvent) { // Added type for 'e'
        setMapPosition([e.latlng.lat, e.latlng.lng]);
        setTempLocation(`${e.latlng.lat},${e.latlng.lng}`);
      },
    });
    return mapPosition ? <Marker position={mapPosition} /> : null;
  }

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Box mt={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );

  return (
    <Box maxWidth={900} mx="auto" mt={4}>
      {/* Banner/Cover Image */}
      <Box sx={{ width: '100%', height: 180, mb: -7, borderRadius: 3, overflow: 'hidden', boxShadow: 2 }}>
        <img
          src={process.env.PUBLIC_URL + '/images/home items.png'}
          alt="Profile Banner"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Box>
      {/* Welcoming message */}
      <Box mb={2}>
        <Typography variant="h5" fontWeight={600} color="#FF9800">
          Welcome back, {name || "User"}!
        </Typography>
      </Box>
      {/* Profile Header */}
      <Box
        sx={{
          background: "linear-gradient(90deg, #FF9800 0%, #FFB74D 100%)",
          borderRadius: 4,
          p: 5,
          mb: 5,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 4,
          boxShadow: 4,
          flexWrap: 'wrap',
        }}
      >
        <Box position="relative" mr={3} mb={{ xs: 2, md: 0 }}>
          <Avatar
            src={editMode ? tempProfilePic : profilePic}
            sx={{ width: 110, height: 110, fontSize: 48, bgcolor: "#fff", color: "#FF9800", boxShadow: 2, border: '3px solid #fff' }}
          >
            {name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
          </Avatar>
          {editMode && (
            <IconButton
              color="primary"
              aria-label="upload picture"
              component="label"
              sx={{ position: "absolute", bottom: 0, right: 0, bgcolor: "#fff", boxShadow: 1 }}
            >
              <input hidden accept="image/*" type="file" onChange={handleProfilePicChange} />
              <PhotoCamera />
            </IconButton>
          )}
        </Box>
        <Box flex={1} minWidth={240}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              {editMode ? (
                <TextField
                  label="Name"
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  size="medium"
                  fullWidth
                  sx={{ mb: 2, bgcolor: "#fff", borderRadius: 2 }}
                />
              ) : (
                <Typography variant="h4" fontWeight={800} color="#fff">
                  {name || "User"}
                </Typography>
              )}
              <Typography variant="subtitle1" color="#fff" sx={{ opacity: 0.92 }}>
                {email}
              </Typography>
              {/* Show user average rating and review count */}
              {userAvgRating !== null && (
                <Box mt={2}>
                  <Typography variant="h6" color="#fff">Avg. User Rating</Typography>
                  <Rating value={Number(userAvgRating)} precision={0.1} readOnly sx={{ color: "#fff" }} />
                  <Typography variant="body2" color="#fff">{userAvgRating.toFixed(1)} / 5 ({userRatingCount} review{userRatingCount === 1 ? '' : 's'})</Typography>
                </Box>
              )}
              {editMode ? (
                <TextField
                  label="Location"
                  value={tempLocation}
                  onChange={e => setTempLocation(e.target.value)}
                  size="medium"
                  fullWidth
                  sx={{ mt: 2, bgcolor: "#fff", borderRadius: 2 }}
                />
              ) : (
                location && (
                  <Typography variant="body2" color="#fff" sx={{ opacity: 0.85, mt: 2 }}>
                    <b>Location:</b> {location}
                  </Typography>
                )
              )}
              {editMode ? (
                <TextField
                  label="Bio"
                  value={tempBio}
                  onChange={e => setTempBio(e.target.value)}
                  size="medium"
                  fullWidth
                  multiline
                  minRows={2}
                  sx={{ mt: 2, bgcolor: "#fff", borderRadius: 2 }}
                />
              ) : (
                bio && (
                  <Typography variant="body2" color="#fff" sx={{ opacity: 0.92, mt: 2 }}>
                    {bio}
                  </Typography>
                )
              )}
              {joinDate && !editMode && (
                <Typography variant="body2" color="#fff" sx={{ opacity: 0.85, mt: 2 }}>
                  <b>Joined:</b> {joinDate}
                </Typography>
              )}
              {saveMessage && (
                <Typography variant="body2" color="#fff" sx={{ mt: 2 }}>
                  {saveMessage}
                </Typography>
              )}
              <Box mt={3} display="flex" gap={2}>
                {editMode ? (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      sx={{ bgcolor: "#fff", color: "#FF9800", fontWeight: 800, borderRadius: 2, boxShadow: 1 }}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<CancelIcon />}
                      sx={{ bgcolor: "#fff", color: "#FF9800", fontWeight: 800, borderRadius: 2, boxShadow: 1 }}
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<EditIcon />}
                    sx={{ bgcolor: "#fff", color: "#FF9800", fontWeight: 800, borderRadius: 2, boxShadow: 1 }}
                    onClick={handleEdit}
                  >
                    Edit Profile
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddCircleOutlineIcon />}
                  sx={{ bgcolor: "#fff", color: "#FF9800", fontWeight: 800, borderRadius: 2, boxShadow: 1 }}
                  onClick={handleAddListing}
                  disabled={editMode}
                >
                  Add Listing
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: "center" }}>
              <Typography variant="h6" color="#fff">Listings</Typography>
              <Typography variant="h4" fontWeight={800} color="#fff">{listings.length}</Typography>
              <Typography variant="h6" color="#fff" mt={2}>Reviews</Typography>
              <Typography variant="h4" fontWeight={800} color="#fff">{reviews.length}</Typography>
              {avgRating && (
                <Box mt={2}>
                  <Typography variant="h6" color="#fff">Avg. Rating</Typography>
                  <Rating value={Number(avgRating)} precision={0.1} readOnly sx={{ color: "#fff" }} />
                  <Typography variant="body2" color="#fff">{avgRating} / 5</Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      </Box>
      {/* Listings and Reviews */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          {/* ...existing code for listings... */}
        </Grid>
        <Grid item xs={12} md={6}>
          {/* ...existing code for reviews... */}
        </Grid>
      </Grid>
      {/* Rental History Section */}
      <Box mt={6}>
        <Typography variant="h6" fontWeight={700} color="#FF9800" mb={2}>
          Rental History
        </Typography>
        {rentalHistory && rentalHistory.length > 0 ? (
          <Box sx={{ background: '#fff', borderRadius: 3, p: 3, boxShadow: 1 }}>
            {rentalHistory.map((rental, idx) => {
              const isOwner = rental.owner && rental.owner._id === userId;
              const isRenter = rental.renter && rental.renter._id === userId;
              const completed = rental.status === 'completed';
              // Check if user has already reviewed the other party for this rental
              let hasLeftReview = false;
              if (completed) {
                if (isOwner) {
                  hasLeftReview = userReviews.some(r => r.rental === rental._id && r.reviewer === userId && r.reviewedUser === rental.renter._id);
                } else if (isRenter) {
                  hasLeftReview = userReviews.some(r => r.rental === rental._id && r.reviewer === userId && r.reviewedUser === rental.owner._id);
                }
              }
              return (
                <Box key={rental._id || idx} mb={2} p={2} sx={{ borderBottom: idx !== rentalHistory.length - 1 ? '1px solid #eee' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} color="#FF9800">
                      {rental.listing?.title || 'Listing'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)} | {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isOwner ? 'You are the owner' : 'You rented this'}
                    </Typography>
                    {/* Review prompt for completed rentals */}
                    {completed && !hasLeftReview && (
                      <Box mt={1} sx={{ background: '#FFF8E1', borderRadius: 2, p: 2, boxShadow: 1 }}>
                        <Typography variant="body2" color="#FF9800" fontWeight={700}>
                          {isOwner ? 'Leave a review for your renter' : 'Leave a review for the owner'}
                        </Typography>
                        {/* You can add a modal or inline form here for review submission */}
                        <Button variant="contained" color="warning" size="small" sx={{ mt: 1, fontWeight: 700, borderRadius: 2 }}>
                          Leave Review
                        </Button>
                      </Box>
                    )}
                  </Box>
                  {/* Show approve/decline buttons if user is owner and rental is pending */}
                  {isOwner && rental.status === 'pending' && (
                    <Box display="flex" gap={1}>
                      <Button variant="contained" color="success" size="small" sx={{ fontWeight: 700, borderRadius: 2 }} onClick={() => handleRentalStatus(rental._id, 'approved')}>Approve</Button>
                      <Button variant="contained" color="error" size="small" sx={{ fontWeight: 700, borderRadius: 2 }} onClick={() => handleRentalStatus(rental._id, 'declined')}>Decline</Button>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ background: '#fff', borderRadius: 3, p: 3, boxShadow: 1, minHeight: 80 }}>
            <Typography variant="body2" color="text.secondary">
              No rental history yet. When you rent equipment, your past rentals will appear here.
            </Typography>
          </Box>
        )}
      </Box>
      {editMode && (
        <Box mt={2} mb={2}>
          <Typography variant="body2" color="#fff" sx={{ mb: 1 }}>
            Click on the map to set your location:
          </Typography>
          <MapContainer center={[-24.6282, 25.9231]} zoom={12} style={{ height: 250, width: '100%', borderRadius: 8 }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <LocationMarker />
          </MapContainer>
          {mapPosition && (
            <Typography variant="body2" color="#fff" sx={{ mt: 1 }}>
              Selected: {mapPosition[0].toFixed(5)}, {mapPosition[1].toFixed(5)}
            </Typography>
          )}
        </Box>
      )}
      {/* User Reviews Section */}
      <Box mt={6}>
        <Typography variant="h6" fontWeight={700} color="#FF9800" mb={2}>
          User Reviews
        </Typography>
        {userReviews.length === 0 && <Typography color="text.secondary">No user reviews yet.</Typography>}
        <ul style={{ padding: 0, listStyle: 'none', width: '100%' }}>
          {userReviews.map(r => (
            <li key={r._id} style={{ background: '#f7f7f7', borderRadius: 10, marginBottom: 12, padding: '1em 1em 0.7em 1em', boxShadow: '0 1px 6px #455a6411' }}>
              <b style={{ color: '#FF9800' }}>Rating:</b> {r.rating} &nbsp;|&nbsp; <b style={{ color: '#607D8B' }}>Comment:</b> {r.comment}
              <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                By: {typeof r.reviewer === 'object' && r.reviewer !== null && 'name' in r.reviewer ? (r.reviewer as any).name : r.reviewer}
              </div>
              <div style={{ color: '#888', fontSize: 12 }}>{new Date(r.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </Box>
    </Box>
  );
};

export default Profile;