import React, { useEffect, useState } from "react";
import { getFavorites, removeFavorite } from "./api";
import { Link } from "react-router-dom";
import jwt_decode from "jwt-decode";

interface JwtPayload { userId?: string; id?: string; email?: string; }

const MyFavourites: React.FC = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to view your favourites.");
      setLoading(false);
      return;
    }
    const decoded = jwt_decode<JwtPayload>(token);
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      setError("Invalid user token.");
      setLoading(false);
      return;
    }
    getFavorites(userId).then(favs => {
      setFavorites(favs.map((f: any) => f.listing));
      setLoading(false);
    });
  }, []);

  const handleRemove = async (listingId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const decoded = jwt_decode<JwtPayload>(token);
    const userId = decoded.userId || decoded.id;
    if (!userId) return;
    await removeFavorite(userId, listingId);
    setFavorites(favs => favs.filter((l: any) => l._id !== listingId));
  };

  if (loading) return <div>Loading favourites...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</div>;

  return (
    <div style={{ maxWidth: 900, margin: '2.5em auto', padding: '0 1em' }}>
      <h2 style={{ textAlign: 'center', color: '#FF9800', fontWeight: 700, marginBottom: '1.5em' }}>My Favourites</h2>
      {favorites.length === 0 && <div style={{ textAlign: 'center', color: '#888' }}>You have no favourite listings yet.</div>}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 32,
        marginTop: 24,
        marginBottom: 40
      }}>
        {favorites.map(listing => (
          <div key={listing._id} style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 6px 32px rgba(0,0,0,0.10)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 370,
            position: 'relative',
            transition: 'box-shadow 0.2s, transform 0.2s',
            cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.16)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 6px 32px rgba(0,0,0,0.10)')}
          >
            <span style={{
              position: 'absolute',
              top: 18,
              right: 18,
              background: listing.available !== false ? '#C8E6C9' : '#FFCDD2',
              color: listing.available !== false ? '#388E3C' : '#C62828',
              borderRadius: 10,
              padding: '4px 16px',
              fontWeight: 800,
              fontSize: 15,
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              zIndex: 2
            }}>
              {listing.available !== false ? 'Available' : 'Unavailable'}
            </span>
            <button
              onClick={e => { e.stopPropagation(); handleRemove(listing._id); }}
              style={{
                position: 'absolute',
                top: 18,
                left: 18,
                background: '#FF9800',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 38,
                height: 38,
                fontSize: 22,
                fontWeight: 900,
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                cursor: 'pointer',
                zIndex: 3
              }}
              title="Remove from favorites"
            >
              ♥
            </button>
            {listing.images && listing.images.length > 0 && (
              <img
                src={`http://localhost:5000${listing.images[0]}`}
                alt={listing.title}
                style={{ width: '100%', height: 190, objectFit: 'cover', borderTopLeftRadius: 18, borderTopRightRadius: 18 }}
              />
            )}
            <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Link to={`/listing/${listing._id}`} style={{
                fontWeight: 800,
                fontSize: 22,
                color: '#FF9800',
                textDecoration: 'none',
                marginBottom: 10,
                display: 'block',
                lineHeight: 1.2
              }}>{listing.title}</Link>
              <div style={{ fontSize: 16, color: '#888', marginBottom: 10 }}>
                <span style={{ background: '#FFF3E0', color: '#FF9800', borderRadius: 8, padding: '4px 14px', fontWeight: 700, fontSize: 15, marginRight: 10 }}>{listing.category}</span>
                <span style={{ fontWeight: 700 }}>{listing.price} {listing.priceUnit || ''}</span>
              </div>
              <div style={{ fontSize: 16, color: '#555', marginBottom: 10 }}>
                <em>Location:</em> {listing.location}
              </div>
              <div style={{ fontSize: 16, color: '#444', flex: 1, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{listing.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyFavourites;
