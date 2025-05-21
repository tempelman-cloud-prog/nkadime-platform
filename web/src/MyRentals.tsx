import React, { useEffect, useState } from "react";
import { getMyRentalRequests, getIncomingRentalRequests, approveRentalRequest, declineRentalRequest } from "./api";
import { Link } from "react-router-dom";
import Alert from '@mui/material/Alert';

interface RentalRequest {
  _id: string;
  listing: any;
  renter: any;
  owner: any;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}

const MyRentals: React.FC = () => {
  const [myRequests, setMyRequests] = useState<RentalRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mine, incoming] = await Promise.all([
        getMyRentalRequests(),
        getIncomingRentalRequests()
      ]);
      setMyRequests(mine);
      setIncomingRequests(incoming);
    } catch (err) {
      setError('Failed to load rental requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveRentalRequest(id);
      fetchRequests();
    } catch {
      setError('Failed to approve request.');
    } finally {
      setActionLoading(null);
    }
  };
  const handleDecline = async (id: string) => {
    setActionLoading(id);
    try {
      await declineRentalRequest(id);
      fetchRequests();
    } catch {
      setError('Failed to decline request.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '2.5em auto', padding: '0 1em' }}>
      <h2 style={{ textAlign: 'center', color: '#FF9800', fontWeight: 700, marginBottom: '1.5em' }}>My Rental Requests</h2>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <h3 style={{ marginTop: 32, color: '#FF9800' }}>Requests I Made</h3>
      {loading ? <div>Loading...</div> : (
        <div style={{ marginBottom: 32 }}>
          {myRequests.length === 0 ? <div style={{ color: '#888' }}>No requests made yet.</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FFF3E0' }}>
                  <th>Listing</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Requested</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map(req => (
                  <tr key={req._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td><Link to={`/listing/${req.listing._id}`}>{req.listing.title}</Link></td>
                    <td>{req.owner?.email || '-'}</td>
                    <td>
                      <span style={{
                        background: req.status === 'pending' ? '#FFFDE7' : req.status === 'approved' ? '#C8E6C9' : '#FFCDD2',
                        color: req.status === 'pending' ? '#FF9800' : req.status === 'approved' ? '#388E3C' : '#C62828',
                        borderRadius: 8, padding: '4px 14px', fontWeight: 700, fontSize: 15
                      }}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span>
                    </td>
                    <td>{new Date(req.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      <h3 style={{ marginTop: 32, color: '#FF9800' }}>Requests for My Listings</h3>
      {loading ? <div>Loading...</div> : (
        <div>
          {incomingRequests.length === 0 ? <div style={{ color: '#888' }}>No incoming requests yet.</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FFF3E0' }}>
                  <th>Listing</th>
                  <th>Renter</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {incomingRequests.map(req => (
                  <tr key={req._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td><Link to={`/listing/${req.listing._id}`}>{req.listing.title}</Link></td>
                    <td>{req.renter?.email || '-'}</td>
                    <td>
                      <span style={{
                        background: req.status === 'pending' ? '#FFFDE7' : req.status === 'approved' ? '#C8E6C9' : '#FFCDD2',
                        color: req.status === 'pending' ? '#FF9800' : req.status === 'approved' ? '#388E3C' : '#C62828',
                        borderRadius: 8, padding: '4px 14px', fontWeight: 700, fontSize: 15
                      }}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span>
                    </td>
                    <td>{new Date(req.createdAt).toLocaleString()}</td>
                    <td>
                      {req.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(req._id)} disabled={actionLoading === req._id} style={{ marginRight: 8, background: '#C8E6C9', color: '#388E3C', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                          <button onClick={() => handleDecline(req._id)} disabled={actionLoading === req._id} style={{ background: '#FFCDD2', color: '#C62828', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>Decline</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default MyRentals;
