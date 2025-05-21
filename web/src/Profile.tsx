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
import { getListings, updateUser, updateRentalStatus, getUserReviews, getUserAverageRating, deleteListing, getUserStats } from "./api";
import jwt_decode from "jwt-decode";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

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
  rental?: string; // Added for rental-based reviews
  reviewedUser?: string; // Added for user-to-user reviews
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
  const [userStats, setUserStats] = useState<any>(null);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const navigate = useNavigate();

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
      // Fetch user stats
      const stats = await getUserStats(uid!);
      setUserStats(stats);
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
      setUserReviews(userRevs);
      const avgData = await getUserAverageRating(uid!);
      setUserAvgRating(avgData.avg);
      setUserRatingCount(avgData.count);
      // Fetch rental history
      const rentals = await import('./api').then(api => api.getRentalHistory(uid!));
      setRentalHistory(rentals);
      setLoading(false);
    }
    fetchProfile();
  }, [routeUserId]);

  // Calculate average rating
  const avgRating = userReviews.length
    ? (
        userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
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
                  : `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/${profilePic.replace(/^\/+/,'')}`
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
          {/* Stats for public view */}
          {userStats && (
            <Box
              mt={2}
              display="flex"
              gap={2}
              flexWrap="wrap"
              flexDirection={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <Box sx={{ background: '#fff', borderRadius: 2, p: 2, minWidth: { xs: '100%', sm: 110 }, width: { xs: '100%', sm: 'auto' }, textAlign: 'center', boxShadow: 1, mb: { xs: 1, sm: 0 } }}>
                <Typography variant="subtitle2" color="#0a2342">Transactions</Typography>
                <Typography variant="h6" fontWeight={800} color="#0a2342">{userStats.successful ?? 0}</Typography>
              </Box>
              <Box sx={{ background: '#fff', borderRadius: 2, p: 2, minWidth: { xs: '100%', sm: 110 }, width: { xs: '100%', sm: 'auto' }, textAlign: 'center', boxShadow: 1, mb: { xs: 1, sm: 0 } }}>
                <Typography variant="subtitle2" color="#0a2342">Disputes</Typography>
                <Typography variant="h6" fontWeight={800} color="#0a2342">{userStats.disputes ?? 0}</Typography>
              </Box>
              <Box sx={{ background: '#fff', borderRadius: 2, p: 2, minWidth: { xs: '100%', sm: 110 }, width: { xs: '100%', sm: 'auto' }, textAlign: 'center', boxShadow: 1, mb: { xs: 1, sm: 0 } }}>
                <Typography variant="subtitle2" color="#0a2342">Avg. Rating</Typography>
                <Typography variant="h6" fontWeight={800} color="#0a2342">{userStats.avg ? userStats.avg.toFixed(1) : 'N/A'}</Typography>
              </Box>
              <Box sx={{ background: '#fff', borderRadius: 2, p: 2, minWidth: { xs: '100%', sm: 110 }, width: { xs: '100%', sm: 'auto' }, textAlign: 'center', boxShadow: 1, mb: { xs: 1, sm: 0 } }}>
                <Typography variant="subtitle2" color="#0a2342">Reviews</Typography>
                <Typography variant="h6" fontWeight={800} color="#0a2342">{userRatingCount ?? 0}</Typography>
              </Box>
              {/* Add Listing button as a stat column for owner only */}
              {isOwnProfile && !editMode && (
                <Box sx={{ background: '#0a2342', borderRadius: 2, p: 2, minWidth: { xs: '100%', sm: 110 }, width: { xs: '100%', sm: 'auto' }, textAlign: 'center', boxShadow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mb: { xs: 1, sm: 0 } }}>
                  <Button
                    variant="contained"
                    startIcon={<AddCircleOutlineIcon />}
                    sx={{ background: '#0a2342', color: '#fff', fontWeight: 700, borderRadius: 2, boxShadow: 2, '&:hover': { background: '#19335c' }, minWidth: 0, fontSize: 15, px: 1, py: 0.5 }}
                    onClick={handleAddListing}
                    size="small"
                  >
                    Add Listing
                  </Button>
                </Box>
              )}
            </Box>
          )}
          {/* Owner-only actions: show only for logged-in user viewing their own profile */}
          {/* Removed Add Listing button from below stats row */}
        </Box>
      </Box>
      {/* Edit Profile Form (only for owner, in edit mode) */}
      {editMode && (!routeUserId || routeUserId === userId) && (
        <Box sx={{ background: '#fff', borderRadius: 3, p: 4, boxShadow: 2, mb: 4, mt: -4, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6" fontWeight={700} color="#0a2342" mb={2}>Edit Profile</Typography>
          <Box component="form" onSubmit={e => { e.preventDefault(); handleSave(); }} display="flex" flexDirection="column" gap={2}>
            <TextField label="Name" value={tempName} onChange={e => setTempName(e.target.value)} fullWidth required />
            <TextField label="Location" value={tempLocation} onChange={e => setTempLocation(e.target.value)} fullWidth />
            <TextField label="Bio" value={tempBio} onChange={e => setTempBio(e.target.value)} fullWidth multiline minRows={2} />
            <Box display="flex" alignItems="center" gap={2}>
              <Button variant="contained" component="label" startIcon={<PhotoCamera />} sx={{ background: '#FF9800', color: '#fff', fontWeight: 700, borderRadius: 2, '&:hover': { background: '#fb8c00' } }}>
                Upload Picture
                <input type="file" accept="image/*" hidden onChange={handleProfilePicChange} />
              </Button>
              {tempProfilePic && (
                <Avatar src={typeof tempProfilePic === 'string' ? tempProfilePic : undefined} sx={{ width: 56, height: 56, ml: 2 }} />
              )}
            </Box>
            <Box display="flex" gap={2} mt={2}>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />} sx={{ background: '#388E3C', color: '#fff', fontWeight: 700, borderRadius: 2, '&:hover': { background: '#2e7d32' } }} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outlined" startIcon={<CancelIcon />} onClick={handleCancel} sx={{ color: '#0a2342', borderColor: '#0a2342', fontWeight: 700, borderRadius: 2 }}>
                Cancel
              </Button>
            </Box>
            {saveMessage && <Typography color={saveMessage.includes('success') ? 'green' : 'red'} mt={1}>{saveMessage}</Typography>}
          </Box>
        </Box>
      )}
      {/* Reviews Section */}
      <Box mt={4}>
        <Typography variant="h6" fontWeight={700} color="#0a2342" mb={2}>
          {name ? `${name}'s Reviews` : 'User Reviews'}
        </Typography>
        {userReviews.length === 0 && <Typography color="text.secondary">No user reviews yet.</Typography>}
        <ul style={{ padding: 0, listStyle: 'none', width: '100%' }}>
          {userReviews.map(r => (
            <li key={r._id} style={{ background: '#f7f7f7', borderRadius: 10, marginBottom: 12, padding: '1em 1em 0.7em 1em', boxShadow: '0 1px 6px #0a234211' }}>
              <b style={{ color: '#0a2342' }}>Rating:</b> {r.rating} &nbsp;|&nbsp; <b style={{ color: '#607D8B' }}>Comment:</b> {r.comment}
              <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                By: {typeof r.reviewer === 'object' && r.reviewer !== null && 'name' in r.reviewer ? (r.reviewer as any).name : r.reviewer}
              </div>
              <div style={{ color: '#888', fontSize: 12 }}>{new Date(r.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </Box>
      {/* User Listings Section */}
      <Box mt={4}>
        <Typography variant="h6" fontWeight={700} color="#0a2342" mb={2}>
          {name ? `${name}'s Listings` : "User's Listings"}
        </Typography>
        {listings.length === 0 ? (
          <Box sx={{ background: '#fff', borderRadius: 3, p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {routeUserId ? "This user has not created any listings yet." : "You have not created any listings yet."}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {listings.map(listing => (
              <Grid item xs={12} sm={6} md={4} key={listing._id}>
                <Box sx={{ background: '#fff', borderRadius: 3, p: 2, boxShadow: 1, minHeight: 180, position: 'relative' }}>
                  <Box sx={{ width: '100%', height: 120, mb: 1, borderRadius: 2, overflow: 'hidden', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={
                        listing.images && listing.images.length > 0
                          ? (listing.images[0].startsWith("http")
                              ? listing.images[0]
                              : `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/${listing.images[0].replace(/^\/+/,'')}`
                            )
                          : process.env.PUBLIC_URL + '/images/home items.png'
                      }
                      alt={listing.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700} color="#0a2342">{listing.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{listing.category}</Typography>
                  <Typography variant="body2" color="text.secondary">{listing.price} {listing.priceUnit ? `/ ${listing.priceUnit}` : ''}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {listing.available ? 'Available' : 'Not Available'}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
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
                  // Optionally show a snackbar or message here
                } else {
                  alert(res.error || 'Failed to delete listing');
                }
              } catch (err) {
                alert('Network or server error. Please try again.');
              }
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
