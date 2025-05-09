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
import { getListings, getReviews, updateUser } from "./api";
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
  const [tempName, setTempName] = useState("");
  const [tempLocation, setTempLocation] = useState("");
  const [tempProfilePic, setTempProfilePic] = useState<string | undefined>(undefined);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
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
        const allListings = await getListings();
        setListings(allListings.filter((l: Listing) => l.owner === uid));
        // Get all reviews for listings owned by this user
        let allReviews: Review[] = [];
        for (const listing of allListings.filter((l: Listing) => l.owner === uid)) {
          const revs = await getReviews(listing._id);
          allReviews = allReviews.concat(revs.filter((r: Review) => r.reviewer === uid));
        }
        setReviews(allReviews);
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
    setEditMode(true);
    setSaveMessage(""); // Clear any previous save message
  };

  const handleCancel = () => {
    setEditMode(false);
    setTempName(name);
    setTempLocation(location);
    setTempProfilePic(profilePic);
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
      });
      setSaving(false);
      if (result && !result.error) {
        setName(result.name);
        setLocation(result.location);
        setProfilePic(result.profilePic);
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
          borderRadius: 3,
          p: 4,
          mb: 4,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 3,
          boxShadow: 3,
          flexWrap: 'wrap',
        }}
      >
        <Box position="relative" mr={3} mb={{ xs: 2, md: 0 }}>
          <Avatar
            src={editMode ? tempProfilePic : profilePic}
            sx={{ width: 90, height: 90, fontSize: 40, bgcolor: "#fff", color: "#FF9800" }}
          >
            {name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
          </Avatar>
          {editMode && (
            <IconButton
              color="primary"
              aria-label="upload picture"
              component="label"
              sx={{ position: "absolute", bottom: 0, right: 0, bgcolor: "#fff" }}
            >
              <input hidden accept="image/*" type="file" onChange={handleProfilePicChange} />
              <PhotoCamera />
            </IconButton>
          )}
        </Box>
        <Box flex={1} minWidth={220}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} md={8}>
              {editMode ? (
                <TextField
                  label="Name"
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{ mb: 1, bgcolor: "#fff", borderRadius: 1 }}
                />
              ) : (
                <Typography variant="h4" fontWeight={700} color="#fff">
                  {name || "User"}
                </Typography>
              )}
              <Typography variant="subtitle1" color="#fff" sx={{ opacity: 0.9 }}>
                {email}
              </Typography>
              {editMode ? (
                <TextField
                  label="Location"
                  value={tempLocation}
                  onChange={e => setTempLocation(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{ mt: 1, bgcolor: "#fff", borderRadius: 1 }}
                />
              ) : (
                location && (
                  <Typography variant="body2" color="#fff" sx={{ opacity: 0.8, mt: 1 }}>
                    <b>Location:</b> {location}
                  </Typography>
                )
              )}
              {joinDate && !editMode && (
                <Typography variant="body2" color="#fff" sx={{ opacity: 0.8, mt: 1 }}>
                  <b>Joined:</b> {joinDate}
                </Typography>
              )}
              {saveMessage && (
                <Typography variant="body2" color="#fff" sx={{ mt: 1 }}>
                  {saveMessage}
                </Typography>
              )}
              <Box mt={2} display="flex" gap={2}>
                {editMode ? (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      sx={{ bgcolor: "#fff", color: "#FF9800", fontWeight: 700 }}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<CancelIcon />}
                      sx={{ bgcolor: "#fff", color: "#FF9800", fontWeight: 700 }}
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
                    sx={{ bgcolor: "#fff", color: "#FF9800", fontWeight: 700 }}
                    onClick={handleEdit}
                  >
                    Edit Profile
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddCircleOutlineIcon />}
                  sx={{ bgcolor: "#fff", color: "#FF9800", fontWeight: 700 }}
                  onClick={handleAddListing}
                  disabled={editMode}
                >
                  Add Listing
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: "center" }}>
              <Typography variant="h6" color="#fff">Listings</Typography>
              <Typography variant="h4" fontWeight={700} color="#fff">{listings.length}</Typography>
              <Typography variant="h6" color="#fff" mt={2}>Reviews</Typography>
              <Typography variant="h4" fontWeight={700} color="#fff">{reviews.length}</Typography>
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
    </Box>
  );
};

export default Profile;