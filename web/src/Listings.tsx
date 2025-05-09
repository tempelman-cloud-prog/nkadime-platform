import React, { useEffect, useState } from "react";
import { getListings } from "./api";
import { Link } from "react-router-dom";

const Listings: React.FC = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const categories = Array.from(new Set(listings.map(l => l.category).filter(Boolean)));

  useEffect(() => {
    getListings().then(data => {
      setListings(data);
      setLoading(false);
    });
  }, []);

  const filteredListings = listings.filter(listing => {
    const matchesSearch =
      listing.title.toLowerCase().includes(search.toLowerCase()) ||
      listing.description.toLowerCase().includes(search.toLowerCase()) ||
      listing.location.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category ? listing.category === category : true;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div>Loading listings...</div>;

  return (
    <div style={{ maxWidth: 700, margin: '2.5em auto', padding: '0 1em' }}>
      <h2 style={{ textAlign: 'center', color: '#FF9800', fontWeight: 700, marginBottom: '1.5em' }}>All Listings</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        <input
          type="text"
          placeholder="Search by title, description, or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '0.7em 1em', borderRadius: 8, border: '1px solid #e0e0e0', minWidth: 220 }}
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ padding: '0.7em 1em', borderRadius: 8, border: '1px solid #e0e0e0', minWidth: 160 }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      {filteredListings.length === 0 && <div>No listings found.</div>}
      <ul style={{ padding: 0, listStyle: 'none' }}>
        {filteredListings.map(listing => (
          <li key={listing._id} className="modern-listing">
            {listing.images && listing.images.length > 0 && (
              <a
                href={`http://localhost:5000${listing.images[0]}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={`http://localhost:5000${listing.images[0]}`}
                  alt={listing.title}
                />
              </a>
            )}
            <div className="modern-listing-details">
              <Link to={`/listing/${listing._id}`} className="modern-listing-title">
                {listing.title}
              </Link>
              <div className="modern-listing-meta">
                <em>Category:</em> {listing.category} | <em>Price:</em> {listing.price} {listing.priceUnit || ""} | <em>Location:</em> {listing.location}
              </div>
              <div className="modern-listing-desc">{listing.description}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Listings;