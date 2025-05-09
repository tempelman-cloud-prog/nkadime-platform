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
import jwt_decode from "jwt-decode";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    if (token) {
      try {
        const decoded: any = jwt_decode(token);
        setUserEmail(decoded.email || "");
      } catch {
        setUserEmail("");
      }
    } else {
      setUserEmail("");
    }
  }, []);

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
      </Routes>
    </Router>
  );
}

export default App;