import React, { useState, useEffect } from 'react';
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
import jwt_decode from "jwt-decode";
import { getNotifications } from "./api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    if (token) {
      try {
        const decoded: any = jwt_decode(token); // Fix: type as any
        setUserEmail(decoded.email || "");
        setUserId(decoded.userId || decoded.id || null);
      } catch {
        setUserEmail("");
        setUserId(null);
      }
    } else {
      setUserEmail("");
      setUserId(null);
    }
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchUnread() {
      if (userId) {
        try {
          const notifications = await getNotifications(userId);
          const unread = notifications.filter((n: any) => !n.read).length;
          setUnreadCount(unread);
        } catch {
          setUnreadCount(0);
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
    setUserEmail("");
    window.location.href = '/login';
  };

  return (
    <Router>
      <nav className="navbar" aria-label="Main navigation">
        <div className="logo" aria-label="Nkadime Home">
          <img src="/images/logo.PNG" alt="Nkadime Logo" style={{ height: '48px', width: 'auto', verticalAlign: 'middle' }} />
        </div>
        <ul className="nav-links" style={{ display: 'flex', gap: '1.5em', listStyle: 'none', margin: 0, padding: 0 }}>
          <li><Link className="nav-btn" to="/">Home</Link></li>
          <li><Link className="nav-btn" to="/about">About Us</Link></li>
          <li><Link className="nav-btn" to="/how-it-works">How It Works</Link></li>
          <li><Link className="nav-btn" to="/faq">FAQ</Link></li>
          <li><Link className="nav-btn" to="/contact">Contact</Link></li>
          {!isLoggedIn && <li><Link className="nav-btn" to="/register">Register</Link></li>}
          <li><Link className="nav-btn" to="/listings">Listings</Link></li>
          {isLoggedIn && <li><Link className="nav-btn" to="/create-listing">Create Listing</Link></li>}
          {isLoggedIn && <li><Link className="nav-btn" to="/profile">Profile</Link></li>}
          {isLoggedIn && <li><Link className="nav-btn" to="/favourites">My Favourites</Link></li>}
          {!isLoggedIn && <li><Link className="nav-btn" to="/login">Login</Link></li>}
          {isLoggedIn && (
            <>
              <li style={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: '#607D8B' }}>
                <span style={{ marginRight: 8, background: '#eee', borderRadius: '50%', width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {userEmail.charAt(0).toUpperCase()}
                </span>
                {userEmail}
              </li>
              <li><button className="nav-btn" onClick={handleLogout}>Logout</button></li>
            </>
          )}
          {isLoggedIn && (
            <li style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Link to="/notifications" aria-label="Notifications" style={{ position: 'relative', display: 'inline-block', padding: 0 }}>
                <span style={{ fontSize: 26, color: unreadCount > 0 ? '#1976d2' : '#607D8B', position: 'relative', display: 'inline-block' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: -6, right: -6, background: '#d32f2f', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                      {unreadCount}
                    </span>
                  )}
                </span>
              </Link>
            </li>
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
        <Route path="/favourites" element={<MyFavourites />} />
      </Routes>
    </Router>
  );
}

export default App;