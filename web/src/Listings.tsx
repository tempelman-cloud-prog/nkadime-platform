import React, { useEffect, useState } from "react";
import { getListings, addFavorite, getFavorites, removeFavorite } from "./api";
import { Link } from "react-router-dom";
import jwt_decode from "jwt-decode";

interface JwtPayload { userId?: string; id?: string; email?: string; }

const Listings: React.FC = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [available, setAvailable] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const fetchListings = async () => {
    console.time('fetchListings');
    setLoading(true);
    const params: Record<string, string | number | boolean> = {};
    if (category) params.category = category;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    if (available) params.available = available;
    params.page = page;
    params.limit = pageSize;
    console.time('fetchListings-fetch');
    const data = await getListings(params);
    console.timeEnd('fetchListings-fetch');
    setListings(data.listings || []);
    setTotal(data.total || 0);
    setPageSize(data.pageSize || 12);
    setLoading(false);
    // For category dropdown
    if (data.listings) {
      setCategories(Array.from(new Set(data.listings.map((l: any) => l.category).filter(Boolean))));
    }
    console.timeEnd('fetchListings');
  };

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line
  }, [category, minPrice, maxPrice, sortBy, sortOrder, page, available]);

  // Fetch favorites for logged-in user
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwt_decode<JwtPayload>(token);
      const userId = decoded.userId || decoded.id;
      if (userId) {
        getFavorites(userId).then(favs => {
          setFavorites(favs.map((f: any) => f.listing._id));
        });
      }
    }
  }, []);

  // Search filter (client-side)
  const filteredListings = listings.filter(listing => {
    const matchesSearch =
      listing.title.toLowerCase().includes(search.toLowerCase()) ||
      listing.description.toLowerCase().includes(search.toLowerCase()) ||
      listing.location.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(total / pageSize);

  // Log after images load (must not be inside a conditional)
  useEffect(() => {
    if (!loading && listings.length > 0) {
      const imgs = Array.from(document.querySelectorAll('img'));
      let loaded = 0;
      imgs.forEach(img => {
        img.addEventListener('load', () => {
          loaded++;
          if (loaded === imgs.length) {
            console.log('All listing images loaded');
          }
        });
      });
    }
  }, [loading, listings]);

  if (loading) return <div>Loading listings...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '2.5em auto', padding: '0 1em' }}>
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
          onChange={e => { setCategory(e.target.value); setPage(1); }}
          style={{ padding: '0.7em 1em', borderRadius: 8, border: '1px solid #e0e0e0', minWidth: 160 }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Min Price"
          value={minPrice}
          onChange={e => { setMinPrice(e.target.value); setPage(1); }}
          style={{ padding: '0.7em 1em', borderRadius: 8, border: '1px solid #e0e0e0', width: 110 }}
        />
        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
          style={{ padding: '0.7em 1em', borderRadius: 8, border: '1px solid #e0e0e0', width: 110 }}
        />
        <select
          value={available}
          onChange={e => { setAvailable(e.target.value); setPage(1); }}
          style={{ padding: '0.7em 1em', borderRadius: 8, border: '1px solid #e0e0e0', minWidth: 120 }}
        >
          <option value="">All Statuses</option>
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
        <select
          value={sortBy}
          onChange={e => { setSortBy(e.target.value); setPage(1); }}
          style={{ padding: '0.7em 1em', borderRadius: 8, border: '1px solid #e0e0e0', minWidth: 140 }}
        >
          <option value="createdAt">Newest</option>
          <option value="price">Price</option>
        </select>
        <select
          value={sortOrder}
          onChange={e => { setSortOrder(e.target.value); setPage(1); }}
          style={{ padding: '0.7em 1em', borderRadius: 8, border: '1px solid #e0e0e0', minWidth: 120 }}
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>
      {filteredListings.length === 0 && <div>No listings found.</div>}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 32,
        marginTop: 24,
        marginBottom: 40
      }}>
        {filteredListings.map(listing => (
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
            {/* Status Chip */}
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
            {/* Favorite Button */}
            <button
              onClick={async e => {
                e.stopPropagation();
                const token = localStorage.getItem("token");
                if (!token) {
                  alert("Please log in to favorite listings.");
                  return;
                }
                const decoded = jwt_decode<JwtPayload>(token);
                const userId = decoded.userId || decoded.id;
                if (!userId) return;
                if (favorites.includes(listing._id)) {
                  await removeFavorite(userId, listing._id);
                  setFavorites(favs => favs.filter(id => id !== listing._id));
                } else {
                  await addFavorite(userId, listing._id);
                  setFavorites(favs => [...favs, listing._id]);
                }
              }}
              style={{
                position: 'absolute',
                top: 18,
                left: 18,
                background: favorites.includes(listing._id) ? '#FF9800' : '#eee',
                color: favorites.includes(listing._id) ? '#fff' : '#FF9800',
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
              title={favorites.includes(listing._id) ? 'Remove from favorites' : 'Add to favorites'}
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
      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          <button onClick={() => setPage(page - 1)} disabled={page === 1} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #eee', background: '#fff', color: '#FF9800', fontWeight: 700, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ padding: '8px 16px', borderRadius: 8, border: p === page ? '2px solid #FF9800' : '1px solid #eee', background: p === page ? '#FFF3E0' : '#fff', color: '#FF9800', fontWeight: 700, cursor: 'pointer' }}>{p}</button>
          ))}
          <button onClick={() => setPage(page + 1)} disabled={page === totalPages} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #eee', background: '#fff', color: '#FF9800', fontWeight: 700, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
        </div>
      )}
    </div>
  );
};

export default Listings;