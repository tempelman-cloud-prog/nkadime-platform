import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import { getListings, updateUser, getUserReviews, getUserAverageRating, deleteListing } from "./api";
import jwt_decode from "jwt-decode";
import TextField from "@mui/material/TextField";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Switch from '@mui/material/Switch';
import { useSnackbar } from "./App";
import Rating from '@mui/material/Rating';

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
  status: 'available' | 'pending approval' | 'unavailable';
}

interface Review {
  _id: string;
  reviewer: string;
  rating: number;
  comment: string;
  createdAt: string;
  listing: string;
  rental?: string; // Added for rental-based reviews
  reviewedUser?: string; // Added for user-to-user reviews
  images?: string[]; // Allow images on Review
}

const Profile: React.FC = () => {
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [listings, setListings] = useState<Listing[]>([]);
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
  const [rentalHistory, setRentalHistory] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [userAvgRating, setUserAvgRating] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const navigate = useNavigate();
  const { showMessage } = useSnackbar();

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      let uid = routeUserId;
      if (!uid) {
        // fallback to logged-in user
        const token = localStorage.getItem("token");
        if (!token) {
          setError("You must be logged in to view your profile.");
          setLoading(false);
          return;
        }
        try {
          const decoded = jwt_decode<JwtPayload & { name?: string; createdAt?: string }>(token);
          uid = decoded.userId || decoded.id || "";
          setEmail(decoded.email || "");
          if (decoded.createdAt) {
            setJoinDate(new Date(decoded.createdAt).toLocaleDateString());
          }
        } catch {
          setError("Invalid token. Please log in again.");
          setLoading(false);
          return;
        }
      }
      setUserId(uid!);
      // Fetch user profile from backend for location and profilePic
      const userRes = await fetch(`http://localhost:5000/api/users/${uid}`);
      const userData = await userRes.json();
      setName(userData.name || "User");
      setLocation(userData.location || "");
      setProfilePic(userData.profilePic || undefined);
      setBio(userData.bio || "");
      if (userData.createdAt) setJoinDate(new Date(userData.createdAt).toLocaleDateString());
      // Fetch all listings by this user
      const listingsData = await getListings();
      setListings((listingsData.listings || []).filter((l: any) => {
        if (typeof l.owner === "string") {
          return l.owner === uid;
        } else if (l.owner && (l.owner as any)._id) {
          return (l.owner as any)._id === uid;
        }
        return false;
      }));
      // Fetch user reviews and average rating
      const userRevs = await getUserReviews(uid!);
      setUserReviews(Array.isArray(userRevs) ? userRevs : []);
      const avgData = await getUserAverageRating(uid!);
      setUserAvgRating(avgData.avg);
      // Fetch rental history
      const rentals = await import('./api').then(api => api.getRentalHistory(uid!));
      setRentalHistory(Array.isArray(rentals) ? rentals : []);
      setShowMap(!!userData.showMapLocation);
      setMapPosition(userData.mapPosition || null);
      setLoading(false);
    }
    fetchProfile();
  }, [routeUserId]);

  const handleEdit = () => {
    setTempName(name);
    setTempLocation(location);
    setTempProfilePic(profilePic);
    setTempBio(bio);
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setTempName(name);
    setTempLocation(location);
    setTempProfilePic(profilePic);
    setTempBio(bio);
    setProfilePicFile(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateUser(userId, {
        name: tempName,
        location: tempLocation,
        profilePic: profilePicFile,
        bio: tempBio,
        mapPosition,
        showMapLocation: showMap,
      });
      setSaving(false);
      if (result && !result.error) {
        setName(result.name);
        setLocation(result.location);
        setProfilePic(result.profilePic);
        setBio(result.bio || "");
        setShowMap(!!result.showMapLocation);
        setMapPosition(result.mapPosition || null);
        setEditMode(false);
        setProfilePicFile(null);
        showMessage("Profile updated successfully!", "success");
      } else {
        showMessage(result.error || "Failed to update profile", "error");
      }
    } catch (err) {
      setSaving(false);
      showMessage("Failed to update profile", "error");
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

  // Determine if this is the logged-in user's own profile
  const token = localStorage.getItem("token");
  let loggedInUserId = null;
  if (token) {
    try {
      const decoded = jwt_decode<JwtPayload & { name?: string; createdAt?: string }>(token);
      loggedInUserId = decoded.userId || decoded.id || null;
    } catch {}
  }
  const isOwnProfile = loggedInUserId && userId && loggedInUserId === userId;

  const handleToggleMap = async () => {
    setShowMap((prev) => !prev);
    // Optionally, update backend immediately
    await updateUser(userId, { showMapLocation: !showMap });
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Box mt={4}>
        <Typography color="error">{error}</Typography>
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
      {/* Profile Header - orange for owner, navy for public */}
      <Box
        sx={{
          background: (!routeUserId || routeUserId === userId)
            ? 'linear-gradient(90deg, #FF9800 0%, #FFB74D 100%)'
            : 'linear-gradient(90deg, #0a2342 0%, #19335c 100%)',
          borderRadius: 4,
          p: { xs: 3, md: 5 },
          mb: 5,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          boxShadow: 4,
          flexWrap: 'wrap',
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Box position="relative" display="flex" flexDirection="column" alignItems="center" mr={{ xs: 0, md: 3 }} mb={{ xs: 2, md: 0 }}>
          <Avatar
            src={
              profilePic
                ? profilePic.startsWith("http")
                  ? profilePic
                  : `${process.env.REACT_APP_API_URL || "https://nkadime-platform.onrender.com"}/${profilePic.replace(/^\/+/,'')}`
                : undefined
            }
            sx={{ width: 110, height: 110, fontSize: 48, bgcolor: "#fff", color: "#0a2342", boxShadow: 2, border: '3px solid #fff' }}
          >
            {name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
          </Avatar>
          {/* Edit Profile Button overlayed on avatar for owner */}
          {isOwnProfile && !editMode && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{
                position: 'absolute',
                top: 0,
                right: -18,
                background: '#0a2342',
                color: '#fff',
                fontWeight: 700,
                borderRadius: '50px',
                minWidth: 0,
                px: 2,
                py: 0.5,
                fontSize: 15,
                boxShadow: 2,
                zIndex: 2,
                '&:hover': { background: '#19335c' },
              }}
              size="small"
            >
              Edit
            </Button>
          )}
          {/* User info under avatar */}
          <Box mt={2} textAlign="center">
            <Typography variant="h5" fontWeight={800} color="#fff" sx={{ mb: 0.5, letterSpacing: 0.5 }}>
              {name || "User"}
            </Typography>
            {location && (
              <Typography variant="body2" color="#fff" sx={{ opacity: 0.85, mb: 0.5 }}>
                <b>Location:</b> {location}
              </Typography>
            )}
            {joinDate && (
              <Typography variant="body2" color="#fff" sx={{ opacity: 0.85, mb: 0.5 }}>
                <b>Joined:</b> {joinDate}
              </Typography>
            )}
          </Box>
        </Box>
        {/* Rest of profile info (bio, stats, actions, etc.) */}
        <Box flex={1} minWidth={240} display="flex" flexDirection="column" justifyContent="center">
          {bio && (
            <Typography variant="body2" color="#fff" sx={{ opacity: 0.92, mb: 1 }}>
              {bio}
            </Typography>
          )}
          {/* Stats for public view - always show, use fallback values if userStats is missing */}
          <Box
            mt={2}
            display="flex"
            gap={2}
            flexWrap="wrap"
            flexDirection={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            {/* Stats Row */}
            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} mb={3}>
              <Box sx={{ background: '#fff', borderRadius: 2, p: 2, minWidth: { xs: '100%', sm: 110 }, width: { xs: '100%', sm: 'auto' }, textAlign: 'center', boxShadow: 1 }}>
                <Typography variant="subtitle2" color="#0a2342">Transactions</Typography>
                <Button variant="text" color="primary" sx={{ fontWeight: 800, fontSize: 18, p: 0, minWidth: 0 }} onClick={() => navigate(`/profile/${routeUserId || userId}/transactions`)}>
                  <Typography variant="h6" fontWeight={800} color="#0a2342">{rentalHistory.length}</Typography>
                </Button>
              </Box>
              <Box sx={{ background: '#fff', borderRadius: 2, p: 2, minWidth: { xs: '100%', sm: 110 }, width: { xs: '100%', sm: 'auto' }, textAlign: 'center', boxShadow: 1 }}>
                <Typography variant="subtitle2" color="#0a2342">Disputes</Typography>
                <Button variant="text" color="primary" sx={{ fontWeight: 800, fontSize: 18, p: 0, minWidth: 0 }} onClick={() => navigate(`/profile/${routeUserId || userId}/disputes`)}>
                  <Typography variant="h6" fontWeight={800} color="#0a2342">
                    {rentalHistory.filter(r => r.dispute && r.dispute.status && r.dispute.status !== 'none' && r.dispute.status !== 'closed' && r.dispute.raisedBy === userId).length}
                  </Typography>
                </Button>
              </Box>
              <Box sx={{ background: '#fff', borderRadius: 2, p: 2, minWidth: { xs: '100%', sm: 110 }, width: { xs: '100%', sm: 'auto' }, textAlign: 'center', boxShadow: 1 }}>
                <Typography variant="subtitle2" color="#0a2342">Reviews</Typography>
                <Button variant="text" color="primary" sx={{ fontWeight: 800, fontSize: 18, p: 0, minWidth: 0 }} onClick={() => navigate(`/profile/${routeUserId || userId}/reviews`)}>
                  <Typography variant="h6" fontWeight={800} color="#0a2342">{userReviews.length}</Typography>
                </Button>
              </Box>
              <Box sx={{ background: '#fff', borderRadius: 2, p: 2, minWidth: { xs: '100%', sm: 110 }, width: { xs: '100%', sm: 'auto' }, textAlign: 'center', boxShadow: 1 }}>
                <Typography variant="subtitle2" color="#0a2342">Avg. Rating</Typography>
                <Typography variant="h6" fontWeight={800} color="#0a2342">{userAvgRating !== null ? userAvgRating.toFixed(1) : 'N/A'}</Typography>
              </Box>
            </Box>
            {/* Add Listing button as a stat column for owner only */}
            {isOwnProfile && !editMode && (
              <Box sx={{ background: '#0a2342', borderRadius: 2, p: 2, minWidth: { xs: '100%', sm: 110 }, width: { xs: '100%', sm: 'auto' }, textAlign: 'center', boxShadow: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1, mb: { xs: 1, sm: 0 } }}>
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutlineIcon />}
                  sx={{ background: '#0a2342', color: '#fff', fontWeight: 700, borderRadius: 2, boxShadow: 2, '&:hover': { background: '#19335c' }, minWidth: 0, fontSize: 15, px: 1, py: 0.5 }}
                  onClick={handleAddListing}
                  size="small"
                >
                  Add Listing
                </Button>
                <Button
                  variant="contained"
                  sx={{ background: '#FF9800', color: '#fff', fontWeight: 700, borderRadius: 2, boxShadow: 2, '&:hover': { background: '#ffa726' }, minWidth: 0, fontSize: 15, px: 1.5, py: 0.5, ml: 1 }}
                  onClick={() => navigate('/listings')}
                  size="small"
                >
                  View Equipment
                </Button>
              </Box>
            )}
          </Box>
          {/* Owner-only actions: show only for logged-in user viewing their own profile */}
          {/* Removed Add Listing button from below stats row */}
        </Box>
      </Box>
      {/* Edit Profile Form (only for owner, in edit mode) */}
      {editMode && (!routeUserId || routeUserId === userId) && (
        <Box sx={{ background: '#fff', borderRadius: 3, p: 4, boxShadow: 2, mb: 4, mt: -4, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6" fontWeight={700} color="#0a2342" mb={2}>Edit Profile</Typography>
          <Box component="form" onSubmit={e => { e.preventDefault(); handleSave(); }} display="flex" flexDirection="column" gap={2}>
            <TextField label="Name" value={tempName} onChange={e => setTempName(e.target.value)} fullWidth required inputProps={{ maxLength: 64 }} autoFocus sx={{
              background: '#F5F5F5', borderRadius: 2, '& .MuiInputBase-root': { fontWeight: 600, fontSize: 17 }, '& .MuiInputLabel-root': { fontWeight: 700 }
            }} />
            <TextField label="Location" value={tempLocation} onChange={e => setTempLocation(e.target.value)} fullWidth inputProps={{ maxLength: 64 }} sx={{
              background: '#F5F5F5', borderRadius: 2, '& .MuiInputBase-root': { fontWeight: 600, fontSize: 17 }, '& .MuiInputLabel-root': { fontWeight: 700 }
            }} />
            <TextField label="Bio" value={tempBio} onChange={e => setTempBio(e.target.value)} fullWidth multiline minRows={2} inputProps={{ maxLength: 240 }} sx={{
              background: '#F5F5F5', borderRadius: 2, '& .MuiInputBase-root': { fontWeight: 500, fontSize: 16 }, '& .MuiInputLabel-root': { fontWeight: 700 }
            }} />
            {/* Map location picker in edit mode */}
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle2" color="#0a2342">Show Map Location</Typography>
              <Switch checked={showMap} onChange={handleToggleMap} color="primary" inputProps={{ 'aria-label': 'Show map location' }} />
              <Typography variant="body2" color="text.secondary">{showMap ? 'Visible' : 'Hidden'}</Typography>
            </Box>
            {showMap && (
              <Box sx={{ height: 220, width: '100%', borderRadius: 2, overflow: 'hidden', boxShadow: 1, mt: 1 }}>
                <MapContainer
                  center={mapPosition || [-24.6282, 25.9231]}
                  zoom={mapPosition ? 13 : 7}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {mapPosition && <Marker position={mapPosition} />}
                  {isOwnProfile && editMode && (
                    <MapClickHandler setMapPosition={setMapPosition} editMode={editMode} />
                  )}
                </MapContainer>
                <Typography variant="caption" color="text.secondary">Click on the map to set your location.</Typography>
              </Box>
            )}
            <Box display="flex" alignItems="center" gap={2}>
              <Button variant="contained" component="label" startIcon={<PhotoCamera />} sx={{ background: '#FF9800', color: '#fff', fontWeight: 700, borderRadius: 2, '&:hover': { background: '#fb8c00' }, transition: 'background 0.2s' }}>
                Upload Picture
                <input type="file" accept="image/*" hidden onChange={handleProfilePicChange} aria-label="Upload profile picture" />
              </Button>
              {tempProfilePic && (
                <Avatar src={typeof tempProfilePic === 'string' ? tempProfilePic : undefined} sx={{ width: 56, height: 56, ml: 2 }} />
              )}
            </Box>
            <Box display="flex" gap={2} mt={2}>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />} sx={{ background: '#388E3C', color: '#fff', fontWeight: 700, borderRadius: 2, '&:hover': { background: '#2e7d32' }, boxShadow: 2, transition: 'background 0.2s, box-shadow 0.2s', minWidth: 120 }} disabled={saving} aria-label="Save profile">
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outlined" startIcon={<CancelIcon />} onClick={handleCancel} sx={{ color: '#0a2342', borderColor: '#0a2342', fontWeight: 700, borderRadius: 2, minWidth: 120, transition: 'border 0.2s, color 0.2s' }} aria-label="Cancel edit">
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      )}
      {/* Reviews Section */}
      <Box mt={4}>
        <Typography variant="h6" fontWeight={700} color="#0a2342" mb={2}>
          {name ? `${name}'s Reviews` : 'User Reviews'}
        </Typography>
        {userReviews.filter(r => {
          // Prevent owner from reviewing their own listing
          if (!r.listing) return true;
          const listing = listings.find(l => l._id === r.listing && (!('deleted' in l) || l.deleted !== true));
          if (!listing) return true;
          // Explicitly cast reviewer as any to avoid TS2339
          const reviewerId = typeof r.reviewer === 'object' && r.reviewer !== null ? ((r.reviewer as any)._id || (r.reviewer as any).id) : r.reviewer;
          return reviewerId !== listing.owner;
        }).length === 0 && <Typography color="text.secondary">No user reviews yet.</Typography>}
        <ul style={{ padding: 0, listStyle: 'none', width: '100%' }}>
          {userReviews.filter(r => {
            if (!r.listing) return true;
            const listing = listings.find(l => l._id === r.listing && (!('deleted' in l) || l.deleted !== true));
            if (!listing) return true;
            // Explicitly cast reviewer as any to avoid TS2339
            const reviewerId = typeof r.reviewer === 'object' && r.reviewer !== null ? ((r.reviewer as any)._id || (r.reviewer as any).id) : r.reviewer;
            return reviewerId !== listing.owner;
          }).map(r => (
            <li key={r._id} style={{ background: '#f7f7f7', borderRadius: 10, marginBottom: 12, padding: '1em 1em 0.7em 1em', boxShadow: '0 1px 6px #0a234211' }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Rating value={r.rating} readOnly precision={0.5} size="small" sx={{ color: '#FF9800' }} />
                <Typography variant="body2" color="#0a2342" fontWeight={600}>{r.rating.toFixed(1)}</Typography>
                <span style={{ color: '#888', fontSize: 13, marginLeft: 8 }}><b style={{ color: '#607D8B' }}>Comment:</b> {r.comment}</span>
              </Box>
              <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                By: {typeof r.reviewer === 'object' && r.reviewer !== null && 'name' in r.reviewer ? (r.reviewer as any).name : r.reviewer}
              </div>
              <div style={{ color: '#888', fontSize: 12 }}>{new Date(r.createdAt).toLocaleString()}</div>
              {/* Review images - show only if available and not the owner's review */}
              {r.images && r.images.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {r.images.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img.startsWith('http') ? img : `${process.env.REACT_APP_API_URL || "https://nkadime-platform.onrender.com"}${img}`}
                      alt={`review-img-${idx}`}
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', transition: 'transform 0.2s' }}
                      onClick={() => { setLightboxImg(img.startsWith('http') ? img : `${process.env.REACT_APP_API_URL || "https://nkadime-platform.onrender.com"}${img}`); setLightboxOpen(true); }}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setLightboxImg(img.startsWith('http') ? img : `${process.env.REACT_APP_API_URL || "https://nkadime-platform.onrender.com"}${img}`); setLightboxOpen(true); } }}
                      tabIndex={0}
                    />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
        <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth="md" aria-label="Image preview dialog">
          <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#222' }}>
            {lightboxImg && (
              <img src={lightboxImg} alt="Preview" style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 12, boxShadow: '0 4px 32px #000a' }} />
            )}
          </DialogContent>
        </Dialog>
      </Box>
      {/* User Listings Section */}
      <Box mt={4}>
        <Typography variant="h6" fontWeight={700} color="#0a2342" mb={2}>
          {name ? `${name}'s Listings` : "User's Listings"}
        </Typography>
        {/* View Transaction History button */}
        <Button
          variant="outlined"
          color="primary"
          sx={{ mb: 2, fontWeight: 700, borderRadius: 2 }}
          onClick={() => navigate(`/profile/${routeUserId || userId}/transactions`)}
        >
          View Transaction History
        </Button>
        {listings.filter(l => !('deleted' in l) || l.deleted !== true).length === 0 ? (
          <Box sx={{ background: '#fff', borderRadius: 3, p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {routeUserId ? "This user has not created any listings yet." : "You have not created any listings yet."}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {listings.filter(l => !('deleted' in l) || l.deleted !== true).map(listing => (
              <Grid item xs={12} sm={6} md={4} key={listing._id}>
                <Box sx={{ background: '#fff', borderRadius: 3, p: 2, boxShadow: 1, minHeight: 180, position: 'relative' }}>
                  <Box sx={{ width: '100%', height: 120, mb: 1, borderRadius: 2, overflow: 'hidden', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {listing.images && listing.images.length > 0 && (
                      <img
                        src={
                          listing.images[0].startsWith("http")
                            ? listing.images[0]
                            : `${process.env.REACT_APP_API_URL || "https://nkadime-platform.onrender.com"}/${listing.images[0].replace(/^\/+/,'')}`
                        }
                        alt={listing.title}
                        style={{ width: '100%', height: 190, objectFit: 'cover', borderTopLeftRadius: 18, borderTopRightRadius: 18 }}
                      />
                    )}
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700} color="#0a2342">{listing.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{listing.category}</Typography>
                  <Typography variant="body2" color="text.secondary">{listing.price} {listing.priceUnit ? `/ ${listing.priceUnit}` : ''}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {listing.status === 'available' ? 'Available' : listing.status === 'pending approval' ? 'Pending Approval' : 'Unavailable'}
                  </Typography>
                  {/* Edit/Delete buttons for own listings */}
                  {isOwnProfile && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => navigate(`/edit-listing/${listing._id}`)}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => { setListingToDelete(listing); setDeleteDialogOpen(true); }}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                      >
                        Delete
                      </Button>
                    </Box>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      {/* Map Location Section */}
      {(isOwnProfile || showMap) && (
        <Box mt={3} mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" fontWeight={700} color="#0a2342">Map Location</Typography>
            {isOwnProfile && (
              <Switch checked={showMap} onChange={handleToggleMap} color="primary" />
            )}
            <Typography variant="body2" color="text.secondary">{showMap ? 'Visible' : 'Hidden'}</Typography>
          </Box>
          {showMap && (
            <Box sx={{ height: 260, width: '100%', borderRadius: 2, overflow: 'hidden', boxShadow: 1, mt: 1 }}>
              <MapContainer
                center={mapPosition || [-24.6282, 25.9231]}
                zoom={mapPosition ? 13 : 7}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                {mapPosition && <Marker position={mapPosition} />}
                {/* Only allow setting marker in edit mode */}
                {isOwnProfile && editMode && (
                  <MapClickHandler setMapPosition={setMapPosition} editMode={editMode} />
                )}
              </MapContainer>
              {isOwnProfile && editMode && (
                <Typography variant="caption" color="text.secondary">Click on the map to set your location.</Typography>
              )}
            </Box>
          )}
        </Box>
      )}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Listing</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the listing <b>{listingToDelete?.title}</b>? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">Cancel</Button>
          <Button
            onClick={async () => {
              if (!listingToDelete) return;
              try {
                const res = await deleteListing(listingToDelete._id);
                if (!res.error) {
                  const allListings = await getListings();
                  setListings((allListings.listings || []).filter((l: any) => {
                    if (typeof l.owner === "string") {
                      return l.owner === userId;
                    } else if (l.owner && (l.owner)._id) {
                      return l.owner._id === userId;
                    }
                    return false;
                  }));
                  setDeleteDialogOpen(false);
                  setListingToDelete(null);
                  showMessage("Listing deleted successfully!", "success");
                  window.dispatchEvent(new CustomEvent('listingDeleted', { detail: listingToDelete._id }));
                } else {
                  showMessage(res.error || 'Failed to delete listing', "error");
                }
              } catch (err) {
                showMessage('Network or server error. Please try again.', "error");
              }
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {/* Dispute List Section (filtered to active disputes only) */}
      <Box mt={4}>
        <Typography variant="h6" fontWeight={700} color="#0a2342" mb={1}>
          {name ? `${name}'s Active Disputes` : 'Active Disputes'}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Only disputes that are currently open, in review, escalated, or unresolved are shown here.
        </Typography>
        <DisputeList disputes={rentalHistory.filter(r => r.dispute && r.dispute.status && r.dispute.status !== 'none' && r.dispute.status !== 'closed' && r.dispute.raisedBy === userId)} />
      </Box>
    </Box>
  );
};

const MapClickHandler = ({ setMapPosition, editMode }: { setMapPosition: React.Dispatch<React.SetStateAction<[number, number] | null>>, editMode: boolean }) => {
  useMapEvents({
    click: (e) => {
      if (editMode) {
        setMapPosition([e.latlng.lat, e.latlng.lng]);
      }
    },
  });  return null;
}

// Helper to map dispute status to label and color
const getDisputeStatusMeta = (status: string) => {
  switch (status) {
    case 'open':
      return { label: 'Open', color: '#FF9800', bg: '#fff3e0' };
    case 'in_review':
      return { label: 'In Review', color: '#1976d2', bg: '#e3f2fd' };
    case 'resolved':
      return { label: 'Resolved', color: '#388e3c', bg: '#e8f5e9' };
    case 'escalated':
      return { label: 'Escalated', color: '#d84315', bg: '#ffebee' };
    default:
      return { label: status.charAt(0).toUpperCase() + status.slice(1), color: '#757575', bg: '#f5f5f5' };
  }
};

// DisputeList component for clarity and polish
const DisputeList: React.FC<{ disputes: any[] }> = ({ disputes }) => {
  const navigate = useNavigate();
  if (!disputes || disputes.length === 0) {
    return (
      <Box sx={{ background: '#fff', borderRadius: 2, p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No active disputes at this time.</Typography>
      </Box>
    );
  }
  return (
    <ul style={{ padding: 0, listStyle: 'none', width: '100%' }}>
      {disputes.map((r: any) => {
        const meta = getDisputeStatusMeta(r.dispute.status);
        return (
          <li key={r._id || r.rentalId} style={{ background: meta.bg, borderRadius: 10, marginBottom: 14, padding: '1em 1em 0.7em 1em', boxShadow: '0 1px 6px #0a234211', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <span
                style={{
                  display: 'inline-block',
                  minWidth: 80,
                  fontWeight: 700,
                  color: meta.color,
                  background: meta.bg,
                  borderRadius: 8,
                  padding: '2px 12px',
                  fontSize: 15,
                  border: `1.5px solid ${meta.color}`,
                  marginRight: 8,
                }}
                aria-label={`Dispute status: ${meta.label}`}
              >
                {meta.label}
              </span>
              <Typography variant="body2" color="#607D8B" fontWeight={600} sx={{ ml: 1 }}>
                Reason:
              </Typography>
              <Typography variant="body2" color="#0a2342" fontWeight={500} sx={{ ml: 0.5 }}>
                {r.dispute.reason || 'N/A'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="#888" fontWeight={500}>
                Rental:
              </Typography>
              <Button
                variant="text"
                color="primary"
                sx={{ fontWeight: 700, fontSize: 15, p: 0, minWidth: 0, textTransform: 'none' }}
                onClick={() => navigate(`/rental/${r.rentalId || r._id}`)}
                aria-label={`View rental details for ${r.title || r.rentalTitle || r.rentalId || r._id}`}
              >
                {r.title || r.rentalTitle || `Rental #${r.rentalId || r._id}`}
              </Button>
            </Box>
            <Typography variant="caption" color="#888" sx={{ mt: 0.5 }}>
              Last updated: {r.dispute.updatedAt ? new Date(r.dispute.updatedAt).toLocaleString() : 'N/A'}
            </Typography>
          </li>
        );
      })}
    </ul>
  );
};

export default Profile;
