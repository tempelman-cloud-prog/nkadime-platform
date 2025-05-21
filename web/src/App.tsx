import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import Home from './Home';
import About from './About';
import FAQ from './FAQ';
import Contact from './Contact';
import Terms from './Terms';
import HowItWorks from './HowItWorks';
import RegisterForm from "./RegisterForm";
import LoginForm from "./LoginForm";
import CreateListingForm from "./CreateListingForm";
import Listings from "./Listings";
import ListingDetails from "./ListingDetails";
import Profile from "./Profile";
import MyFavourites from "./MyFavourites";
import Notifications from "./Notifications";
import AdminPanel from "./AdminPanel";
import jwt_decode from "jwt-decode";
import { getNotifications, markNotificationsRead } from "./api";
import Popover from '@mui/material/Popover';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import EditListingForm from "./EditListingForm";
import MyRentals from "./MyRentals";
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import Messages from './Messages';

// Snackbar and Loading context for global feedback and loading
const SnackbarContext = createContext<{ showMessage: (msg: string, severity?: 'success' | 'error' | 'info' | 'warning') => void }>({ showMessage: () => {} });
const LoadingContext = createContext<{ setLoading: (loading: boolean) => void }>({ setLoading: () => {} });
export const useSnackbar = () => useContext(SnackbarContext);
export const useLoading = () => useContext(LoadingContext);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState("");
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const notifPopoverOpen = Boolean(notifAnchorEl);
  const notifPopoverId = notifPopoverOpen ? 'notification-popover' : undefined;

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    if (token) {
      try {
        const decoded: any = jwt_decode(token); // Fix: type as any
        setUserId(decoded.userId || decoded.id || null);
      } catch {
        setUserId(null);
      }
    } else {
      setUserId(null);
    }
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchUnread() {
      if (userId) {
        try {
          setLoading(true); // Show global loading
          const notifications = await getNotifications(userId);
          const unread = notifications.filter((n: any) => !n.read).length;
          setUnreadCount(unread);
        } catch {
          setUnreadCount(0);
        } finally {
          setLoading(false);
        }
      } else {
        setUnreadCount(0);
      }
    }
    fetchUnread();
    interval = setInterval(fetchUnread, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserId(null);
    window.location.href = '/login';
  };

  const handleNotifIconClick = async (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
    if (userId) {
      setNotifLoading(true);
      setNotifError("");
      setLoading(true); // Show global loading
      try {
        const nots = await getNotifications(userId);
        setNotifications(nots);
        setNotifLoading(false);
        // Mark all as read if any unread
        if (nots.some((n: any) => !n.read)) {
          await markNotificationsRead(userId);
          setUnreadCount(0);
        }
      } catch (e: any) {
        setNotifError("Failed to load notifications");
        setNotifLoading(false);
      } finally {
        setLoading(false);
      }
    }
  };
  const handleNotifPopoverClose = () => {
    setNotifAnchorEl(null);
  };

  // Add a function to mark all as read from the dropdown
  const handleMarkAllRead = async () => {
    if (userId) {
      await markNotificationsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const showMessage = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };
  const handleSnackbarClose = (_?: any, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbar(s => ({ ...s, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ showMessage }}>
      <LoadingContext.Provider value={{ setLoading }}>
        {loading && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 2000 }} aria-label="Loading..." />}
        <Router>
          <nav className="navbar" aria-label="Main navigation">
            <div className="logo" aria-label="Nkadime Home">
              <img src="/images/logo.PNG" alt="Nkadime Logo" style={{ height: '48px', width: 'auto', verticalAlign: 'middle' }} />
            </div>
            <ul className="nav-links" style={{ display: 'flex', gap: '1.5em', listStyle: 'none', margin: 0, padding: 0 }}>
              <li><Link className="nav-btn" to="/">Home</Link></li>
              {!isLoggedIn && <li><Link className="nav-btn" to="/about">About Us</Link></li>}
              {!isLoggedIn && <li><Link className="nav-btn" to="/how-it-works">How It Works</Link></li>}
              {!isLoggedIn && <li><Link className="nav-btn" to="/faq">FAQ</Link></li>}
              {!isLoggedIn && <li><Link className="nav-btn" to="/contact">Contact</Link></li>}
              {!isLoggedIn && <li><Link className="nav-btn" to="/register">Register</Link></li>}
              <li><Link className="nav-btn" to="/listings">Listings</Link></li>
              {isLoggedIn && <li><Link className="nav-btn" to="/create-listing">Create Listing</Link></li>}
              {isLoggedIn && <li><Link className="nav-btn" to="/profile">Profile</Link></li>}
              {isLoggedIn && <li><Link className="nav-btn" to="/favourites">My Favourites</Link></li>}
              {isLoggedIn && <li><Link className="nav-btn" to="/my-rentals">My Rentals</Link></li>}
              {!isLoggedIn && <li><Link className="nav-btn" to="/login">Login</Link></li>}
              {isLoggedIn && (
                <>
                  <li><button className="nav-btn" onClick={handleLogout}>Logout</button></li>
                  <li style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <IconButton
                      aria-label="Notifications"
                      color="inherit"
                      onClick={handleNotifIconClick}
                      aria-describedby={notifPopoverId}
                      sx={{ p: 0, ml: 1 }}
                    >
                      <Badge badgeContent={unreadCount} color="error" overlap="circular" invisible={unreadCount === 0}>
                        <span style={{ fontSize: 26, color: unreadCount > 0 ? '#1976d2' : '#607D8B', position: 'relative', display: 'inline-block' }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        </span>
                      </Badge>
                    </IconButton>
                    <Popover
                      id={notifPopoverId}
                      open={notifPopoverOpen}
                      anchorEl={notifAnchorEl}
                      onClose={handleNotifPopoverClose}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      PaperProps={{ sx: { minWidth: 340, maxWidth: 420, p: 2, boxShadow: 4 } }}
                    >
                      <div style={{ minHeight: 60, minWidth: 320 }}>
                        <Typography component="h3" sx={{ color: '#FF9800', fontWeight: 700, fontSize: 20, mb: 1 }}>Notifications</Typography>
                        {notifLoading ? (
                          <div style={{ textAlign: 'center', padding: 24 }}><CircularProgress size={28} /></div>
                        ) : notifError ? (
                          <div style={{ color: 'red', textAlign: 'center', padding: 12 }}>{notifError}</div>
                        ) : notifications.length === 0 ? (
                          <div style={{ color: '#888', textAlign: 'center', padding: 12 }}>No notifications yet.</div>
                        ) : (
                          <>
                            {notifications.some((n) => !n.read) && (
                              <Button onClick={handleMarkAllRead} size="small" sx={{ mb: 1, color: '#1976d2', fontWeight: 700, textTransform: 'none' }}>Mark all as read</Button>
                            )}
                            <Divider sx={{ mb: 1 }} />
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 320, overflowY: 'auto' }}>
                              {notifications.map((n, idx) => (
                                <li
                                  key={n._id || idx}
                                  style={{
                                    background: n.read ? '#fff' : '#FFF3E0',
                                    borderLeft: n.read ? '4px solid #fff' : '4px solid #FF9800',
                                    borderRadius: 10,
                                    boxShadow: '0 1px 6px #455a6411',
                                    marginBottom: 10,
                                    padding: '0.9em 1em',
                                    fontSize: 16,
                                    color: '#444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    fontWeight: n.read ? 400 : 700,
                                    opacity: n.read ? 0.7 : 1,
                                    outline: n.read ? 'none' : '2px solid #FF9800',
                                  }}
                                  tabIndex={0}
                                  aria-label={n.message}
                                >
                                  <span style={{ fontWeight: 700, color: '#FF9800', minWidth: 70 }}>{n.type}</span>
                                  <span style={{ flex: 1 }}>{n.message}</span>
                                  <span style={{ color: '#888', fontSize: 13 }}>{new Date(n.createdAt).toLocaleString()}</span>
                                </li>
                              ))}
                            </ul>
                            <Divider sx={{ my: 1 }} />
                            <Button
                              component={RouterLink}
                              to="/notifications"
                              size="small"
                              sx={{ color: '#607D8B', fontWeight: 700, textTransform: 'none', width: '100%' }}
                              onClick={handleNotifPopoverClose}
                            >
                              View all notifications
                            </Button>
                          </>
                        )}
                      </div>
                    </Popover>
                  </li>
                  <li>
                    <Link className="nav-btn" to="/messages" title="Messages" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Badge color="primary" badgeContent={unreadCount} invisible={!unreadCount}>
                        <MailOutlineIcon style={{ fontSize: 22, verticalAlign: 'middle' }} />
                      </Badge>
                      <span style={{ display: 'none', marginLeft: 4 }}>Messages</span>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/login" element={<LoginForm setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/create-listing" element={<CreateListingForm />} />
            <Route path="/listing/:id" element={<ListingDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/favourites" element={<MyFavourites />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/edit-listing/:id" element={<EditListingForm />} />
            <Route path="/my-rentals" element={<MyRentals />} />
            <Route path="/messages" element={<Messages />} />
          </Routes>
          <Snackbar
            open={snackbar.open}
            autoHideDuration={3500}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            {/* Only one child allowed: MuiAlert */}
            <MuiAlert
              onClose={handleSnackbarClose}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
              elevation={6}
              variant="filled"
            >
              {snackbar.message}
            </MuiAlert>
          </Snackbar>
        </Router>
      </LoadingContext.Provider>
    </SnackbarContext.Provider>
  );
}

export default App;