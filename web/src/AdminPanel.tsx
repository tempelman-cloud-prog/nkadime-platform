import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
import { getOpenDisputes, resolveDispute, getListingMessages, sendListingMessage, getAllUsers, suspendUser, activateUser, deleteUser, getAllListingsAdmin, deleteListingAdmin, getAllRentalsAdmin, updateRentalStatusAdmin, getAdminAnalytics } from './api';

const AdminPanel: React.FC = () => {
  const [tab, setTab] = React.useState(0);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolution, setResolution] = useState('');
  const [status, setStatus] = useState('resolved');
  const [resolveError, setResolveError] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [messageError, setMessageError] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null);
  const [userActionError, setUserActionError] = useState('');
  const [listings, setListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState('');
  const [listingActionLoading, setListingActionLoading] = useState<string | null>(null);
  const [listingActionError, setListingActionError] = useState('');
  const [rentals, setRentals] = useState<any[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(false);
  const [rentalsError, setRentalsError] = useState('');
  const [rentalActionLoading, setRentalActionLoading] = useState<string | null>(null);
  const [rentalActionError, setRentalActionError] = useState('');
  const [statusEdit, setStatusEdit] = useState<{ [rentalId: string]: string }>({});
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  useEffect(() => {
    if (tab === 3) {
      setLoading(true);
      getOpenDisputes().then(res => {
        setDisputes(res.disputes || []);
        setLoading(false);
      });
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 0) {
      setUsersLoading(true);
      setUsersError('');
      getAllUsers()
        .then(res => setUsers(res.users || []))
        .catch(e => setUsersError(e.message || 'Failed to load users'))
        .finally(() => setUsersLoading(false));
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 1) {
      setListingsLoading(true);
      setListingsError('');
      getAllListingsAdmin()
        .then(res => setListings(res.listings || []))
        .catch(e => setListingsError(e.message || 'Failed to load listings'))
        .finally(() => setListingsLoading(false));
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 2) {
      setRentalsLoading(true);
      setRentalsError('');
      getAllRentalsAdmin()
        .then(res => setRentals(res.rentals || []))
        .catch(e => setRentalsError(e.message || 'Failed to load rentals'))
        .finally(() => setRentalsLoading(false));
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 4) {
      setAnalyticsLoading(true);
      setAnalyticsError('');
      getAdminAnalytics()
        .then(res => setAnalytics(res))
        .catch(e => setAnalyticsError(e.message || 'Failed to load analytics'))
        .finally(() => setAnalyticsLoading(false));
    }
  }, [tab]);

  const handleOpenDispute = async (d: any) => {
    setSelectedDispute(d);
    setResolution('');
    setStatus('resolved');
    setResolveError('');
    setMessages([]);
    setMessageText('');
    setMessageError('');
    setMessageLoading(true);
    try {
      const msgs = await getListingMessages(d.listing._id);
      setMessages(msgs || []);
    } catch {
      setMessages([]);
    } finally {
      setMessageLoading(false);
    }
  };

  const handleResolve = async () => {
    setResolveLoading(true);
    setResolveError('');
    try {
      const res = await resolveDispute(selectedDispute._id, { resolution, status });
      if (res && res.success) {
        setSelectedDispute(null);
        setDisputes(disputes.filter((d: any) => d._id !== selectedDispute._id));
      } else {
        setResolveError(res.error || 'Failed to resolve dispute');
      }
    } catch (e: any) {
      setResolveError(e.message || 'Failed to resolve dispute');
    } finally {
      setResolveLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    setMessageError('');
    setMessageLoading(true);
    try {
      await sendListingMessage(selectedDispute.listing._id, messageText);
      const msgs = await getListingMessages(selectedDispute.listing._id);
      setMessages(msgs || []);
      setMessageText('');
    } catch (e: any) {
      setMessageError(e.message || 'Failed to send message');
    } finally {
      setMessageLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    setUserActionLoading(userId);
    setUserActionError('');
    try {
      await suspendUser(userId);
      setUsers(users => users.map(u => u._id === userId ? { ...u, status: 'suspended' } : u));
    } catch (e: any) {
      setUserActionError(e.message || 'Failed to suspend user');
    } finally {
      setUserActionLoading(null);
    }
  };
  const handleActivateUser = async (userId: string) => {
    setUserActionLoading(userId);
    setUserActionError('');
    try {
      await activateUser(userId);
      setUsers(users => users.map(u => u._id === userId ? { ...u, status: 'active' } : u));
    } catch (e: any) {
      setUserActionError(e.message || 'Failed to activate user');
    } finally {
      setUserActionLoading(null);
    }
  };
  const handleDeleteUser = async (userId: string) => {
    setUserActionLoading(userId);
    setUserActionError('');
    try {
      await deleteUser(userId);
      setUsers(users => users.filter(u => u._id !== userId));
    } catch (e: any) {
      setUserActionError(e.message || 'Failed to delete user');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    setListingActionLoading(listingId);
    setListingActionError('');
    try {
      const res = await deleteListingAdmin(listingId);
      if (!res.error) {
        setListings(listings => listings.filter(l => l._id !== listingId));
      } else {
        setListingActionError(res.error || 'Failed to delete listing');
      }
    } catch (e: any) {
      setListingActionError(e.message || 'Failed to delete listing');
    } finally {
      setListingActionLoading(null);
    }
  };

  const handleStatusEdit = (rentalId: string, value: string) => {
    setStatusEdit(edit => ({ ...edit, [rentalId]: value }));
  };

  const handleUpdateRentalStatus = async (rentalId: string) => {
    setRentalActionLoading(rentalId);
    setRentalActionError('');
    try {
      const res = await updateRentalStatusAdmin(rentalId, { status: statusEdit[rentalId] });
      if (!res.error) {
        setRentals(rentals => rentals.map(r => r._id === rentalId ? { ...r, status: statusEdit[rentalId] } : r));
      } else {
        setRentalActionError(res.error || 'Failed to update status');
      }
    } catch (e: any) {
      setRentalActionError(e.message || 'Failed to update status');
    } finally {
      setRentalActionLoading(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h4" fontWeight={800} color="#FF9800" mb={3}>
        Admin Panel
      </Typography>
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Users" />
          <Tab label="Listings" />
          <Tab label="Rentals" />
          <Tab label="Disputes" />
          <Tab label="Analytics" />
        </Tabs>
      </Paper>
      <Box>
        {tab === 0 && (
          <Box>
            <Typography variant="h6" fontWeight={700} color="#1976D2" mb={2}>All Users</Typography>
            {usersLoading ? <Typography>Loading users...</Typography> : usersError ? <Alert severity="error">{usersError}</Alert> : (
              <>
                {users.length === 0 ? (
                  <Alert severity="info">No users found or you do not have admin access.</Alert>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                      <thead>
                        <tr style={{ background: '#E3F2FD' }}>
                          <th style={{ padding: 8, textAlign: 'left' }}>Name</th>
                          <th style={{ padding: 8, textAlign: 'left' }}>Email</th>
                          <th style={{ padding: 8, textAlign: 'left' }}>Status</th>
                          <th style={{ padding: 8, textAlign: 'left' }}>Role</th>
                          <th style={{ padding: 8, textAlign: 'left' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user._id} style={{ borderBottom: '1px solid #eee', background: '#fff' }}>
                            <td style={{ padding: 8 }}>{user.name || '-'}</td>
                            <td style={{ padding: 8 }}>{user.email || '-'}</td>
                            <td style={{ padding: 8 }}>{user.status || '-'}</td>
                            <td style={{ padding: 8 }}>{user.role || '-'}</td>
                            <td style={{ padding: 8 }}>
                              {user.status === 'active' ? (
                                <Button size="small" color="warning" variant="outlined" onClick={() => handleSuspendUser(user._id)} disabled={userActionLoading === user._id}>Suspend</Button>
                              ) : (
                                <Button size="small" color="success" variant="outlined" onClick={() => handleActivateUser(user._id)} disabled={userActionLoading === user._id}>Activate</Button>
                              )}
                              <Button size="small" color="error" variant="outlined" sx={{ ml: 1 }} onClick={() => handleDeleteUser(user._id)} disabled={userActionLoading === user._id}>Delete</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {userActionError && <Alert severity="error" sx={{ mt: 2 }}>{userActionError}</Alert>}
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
        {tab === 1 && (
          <Box>
            <Typography variant="h6" fontWeight={700} color="#1976D2" mb={2}>All Listings</Typography>
            {listingsLoading ? <Typography>Loading listings...</Typography> : listingsError ? <Alert severity="error">{listingsError}</Alert> : (
              <>
                {listings.length === 0 ? (
                  <Alert severity="info">No listings found or you do not have admin access.</Alert>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                      <thead>
                        <tr style={{ background: '#FFF3E0' }}>
                          <th style={{ padding: 8, textAlign: 'left' }}>Title</th>
                          <th style={{ padding: 8, textAlign: 'left' }}>Category</th>
                          <th style={{ padding: 8, textAlign: 'left' }}>Price</th>
                          <th style={{ padding: 8, textAlign: 'left' }}>Location</th>
                          <th style={{ padding: 8, textAlign: 'left' }}>Owner</th>
                          <th style={{ padding: 8, textAlign: 'left' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listings.map(listing => (
                          <tr key={listing._id} style={{ borderBottom: '1px solid #eee', background: '#fff' }}>
                            <td style={{ padding: 8 }}>{listing.title}</td>
                            <td style={{ padding: 8 }}>{listing.category}</td>
                            <td style={{ padding: 8 }}>{listing.price} {listing.priceUnit || ''}</td>
                            <td style={{ padding: 8 }}>{listing.location}</td>
                            <td style={{ padding: 8 }}>{listing.owner?.name || listing.owner?.email || '-'}</td>
                            <td style={{ padding: 8 }}>
                              <Button size="small" color="error" variant="outlined" onClick={() => handleDeleteListing(listing._id)} disabled={listingActionLoading === listing._id}>Delete</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {listingActionError && <Alert severity="error" sx={{ mt: 2 }}>{listingActionError}</Alert>}
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
        {tab === 2 && (
          <Box>
            <Typography variant="h6" fontWeight={700} color="#1976D2" mb={2}>All Rentals</Typography>
            {rentalsLoading ? <Typography>Loading rentals...</Typography> : rentalsError ? <Alert severity="error">{rentalsError}</Alert> : (
              <>
                {rentals.length === 0 ? (
                  <Alert severity="info">No rentals found or you do not have admin access.</Alert>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                      <thead>
                        <tr style={{ background: '#E8F5E9' }}>
                          <th style={{ padding: 8, textAlign: 'left' }}>Listing</th>
                          <th style={{ padding: 8, textAlign: 'left' }}>Renter</th>
                          <th style={{ padding: 8, textAlign: 'left' }}>Owner</th>
                          <th style={{ padding: 8, textAlign: 'left' }}>Status</th>
                          <th style={{ padding: 8, textAlign: 'left' }}>Created</th>
                          <th style={{ padding: 8, textAlign: 'left' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rentals.map(rental => (
                          <tr key={rental._id} style={{ borderBottom: '1px solid #eee', background: '#fff' }}>
                            <td style={{ padding: 8 }}>{rental.listing?.title || '-'}</td>
                            <td style={{ padding: 8 }}>{rental.renter?.name || rental.renter?.email || '-'}</td>
                            <td style={{ padding: 8 }}>{rental.owner?.name || rental.owner?.email || '-'}</td>
                            <td style={{ padding: 8 }}>
                              <select
                                value={statusEdit[rental._id] ?? rental.status}
                                onChange={e => handleStatusEdit(rental._id, e.target.value)}
                                style={{ minWidth: 120, padding: 4 }}
                                disabled={rentalActionLoading === rental._id}
                              >
                                {['pending','approved','declined','paid','active','in-progress','completed','cancelled'].map(s => (
                                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: 8 }}>{new Date(rental.createdAt).toLocaleString()}</td>
                            <td style={{ padding: 8 }}>
                              <Button size="small" color="primary" variant="outlined" onClick={() => handleUpdateRentalStatus(rental._id)} disabled={rentalActionLoading === rental._id || (statusEdit[rental._id] ?? rental.status) === rental.status}>
                                {rentalActionLoading === rental._id ? 'Updating...' : 'Update Status'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rentalActionError && <Alert severity="error" sx={{ mt: 2 }}>{rentalActionError}</Alert>}
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
        {tab === 3 && (
          <Box>
            <Typography variant="h6" fontWeight={700} color="#C62828" mb={2}>Open Disputes</Typography>
            {loading ? <Typography>Loading...</Typography> : disputes.length === 0 ? <Alert severity="info">No open disputes.</Alert> : (
              disputes.map((d: any) => (
                <Paper key={d._id} sx={{ mb: 2, p: 2, borderRadius: 2 }}>
                  <Typography fontWeight={700}>Rental: {d.listing?.title}</Typography>
                  <Typography>Owner: {d.owner?.name} | Renter: {d.renter?.name}</Typography>
                  <Typography>Status: {d.dispute.status}</Typography>
                  <Typography>Reason: {d.dispute.reason}</Typography>
                  {d.dispute.evidenceUrl && <Typography>Evidence: <a href={d.dispute.evidenceUrl} target="_blank" rel="noopener noreferrer">View</a></Typography>}
                  <Button variant="outlined" color="primary" sx={{ mt: 1 }} onClick={() => handleOpenDispute(d)}>View & Resolve</Button>
                </Paper>
              )))}
            <Dialog open={!!selectedDispute} onClose={() => setSelectedDispute(null)} maxWidth="md" fullWidth>
              <DialogTitle>Dispute Details</DialogTitle>
              <DialogContent>
                {selectedDispute && (
                  <>
                    <Typography fontWeight={700}>Rental: {selectedDispute.listing?.title}</Typography>
                    <Typography>Owner: {selectedDispute.owner?.name} | Renter: {selectedDispute.renter?.name}</Typography>
                    <Typography>Status: {selectedDispute.dispute.status}</Typography>
                    <Typography>Reason: {selectedDispute.dispute.reason}</Typography>
                    {selectedDispute.dispute.evidenceUrl && <Typography>Evidence: <a href={selectedDispute.dispute.evidenceUrl} target="_blank" rel="noopener noreferrer">View</a></Typography>}
                    <Typography mt={2} fontWeight={700}>Messages</Typography>
                    {messageLoading ? <Typography>Loading messages...</Typography> : (
                      <Box sx={{ maxHeight: 200, overflowY: 'auto', background: '#f7f7f7', borderRadius: 2, p: 1, mb: 2 }}>
                        {messages.length === 0 ? <Typography color="text.secondary">No messages yet.</Typography> : messages.map((msg: any, i: number) => (
                          <Box key={i} sx={{ mb: 1 }}>
                            <Typography fontSize={14}><b>{msg.fromUser?.name || 'User'}:</b> {msg.message}</Typography>
                            <Typography fontSize={12} color="text.secondary">{new Date(msg.createdAt).toLocaleString()}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                      <TextField size="small" fullWidth label="Send message to renter" value={messageText} onChange={e => setMessageText(e.target.value)} disabled={messageLoading} />
                      <Button variant="contained" onClick={handleSendMessage} disabled={messageLoading || !messageText.trim()}>Send</Button>
                    </Box>
                    {messageError && <Alert severity="error">{messageError}</Alert>}
                    <Typography mt={2} fontWeight={700}>Resolution</Typography>
                    <TextField label="Resolution" size="small" fullWidth value={resolution} onChange={e => setResolution(e.target.value)} sx={{ mb: 2 }} multiline minRows={2} />
                    <TextField label="Status" size="small" fullWidth value={status} onChange={e => setStatus(e.target.value)} sx={{ mb: 2 }} />
                    {resolveError && <Alert severity="error">{resolveError}</Alert>}
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedDispute(null)}>Cancel</Button>
                <Button onClick={handleResolve} variant="contained" color="success" disabled={resolveLoading}>{resolveLoading ? 'Resolving...' : 'Resolve Dispute'}</Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}
        {tab === 4 && (
          <Box>
            <Typography variant="h6" fontWeight={700} color="#1976D2" mb={2}>Platform Analytics</Typography>
            {analyticsLoading ? <Typography>Loading analytics...</Typography> : analyticsError ? <Alert severity="error">{analyticsError}</Alert> : analytics ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mt: 2 }}>
                <Paper sx={{ p: 3, minWidth: 220, textAlign: 'center', background: '#E3F2FD' }}>
                  <Typography variant="h5" fontWeight={800} color="#1976D2">{analytics.userCount}</Typography>
                  <Typography fontWeight={700}>Total Users</Typography>
                </Paper>
                <Paper sx={{ p: 3, minWidth: 220, textAlign: 'center', background: '#FFF3E0' }}>
                  <Typography variant="h5" fontWeight={800} color="#FF9800">{analytics.listingCount}</Typography>
                  <Typography fontWeight={700}>Total Listings</Typography>
                </Paper>
                <Paper sx={{ p: 3, minWidth: 220, textAlign: 'center', background: '#E8F5E9' }}>
                  <Typography variant="h5" fontWeight={800} color="#388E3C">{analytics.rentalCount}</Typography>
                  <Typography fontWeight={700}>Total Rentals</Typography>
                </Paper>
                <Paper sx={{ p: 3, minWidth: 220, textAlign: 'center', background: '#B3E5FC' }}>
                  <Typography variant="h5" fontWeight={800} color="#0288D1">{analytics.availableRentals}</Typography>
                  <Typography fontWeight={700}>Currently Available Rentals</Typography>
                </Paper>
                <Paper sx={{ p: 3, minWidth: 220, textAlign: 'center', background: '#F3E5F5' }}>
                  <Typography variant="h5" fontWeight={800} color="#8E24AA">{analytics.activeRentals}</Typography>
                  <Typography fontWeight={700}>Active Rentals</Typography>
                </Paper>
                <Paper sx={{ p: 3, minWidth: 220, textAlign: 'center', background: '#E0F7FA' }}>
                  <Typography variant="h5" fontWeight={800} color="#00ACC1">{analytics.completedRentals}</Typography>
                  <Typography fontWeight={700}>Completed Rentals</Typography>
                </Paper>
              </Box>
            ) : (
              <Alert severity="info">No analytics data available.</Alert>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdminPanel;
