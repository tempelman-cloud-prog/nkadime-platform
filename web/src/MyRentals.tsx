import React, { useEffect, useState, useRef } from "react";
import { getMyRentalRequests, getIncomingRentalRequests, approveRentalRequest, declineRentalRequest, addRentalPayment, raiseDispute, exportRentalAudit, updateRentalStatusWithAudit } from "./api";
import { Link } from "react-router-dom";
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import DescriptionIcon from '@mui/icons-material/Description';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Grow from '@mui/material/Grow';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import NoDataSvg from './NoDataSvg'; // You may need to create or replace with a suitable SVG/illustration

// Add helper to get current userId from JWT
function getCurrentUserId() {
  const token = localStorage.getItem('token');
  if (!token) return '';
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.userId || decoded.id || '';
  } catch {
    return '';
  }
}

// Corrected RentalRequest interface to include all used properties
interface RentalRequest {
  _id: string;
  listing: {
    _id: string;
    title: string;
    price?: number;
    [key: string]: any;
  };
  renter: {
    _id: string;
    email?: string;
    name?: string;
    [key: string]: any;
  };
  owner: {
    _id: string;
    email?: string;
    name?: string;
  };
  status: 'pending' | 'approved' | 'declined' | 'paid' | 'active' | 'in-progress' | 'completed' | 'cancelled';
  payment?: {
    amount: number;
    method: string;
    reference: string;
    paidAt: string;
  };
  dispute?: {
    status: string;
    reason?: string;
    evidenceUrl?: string;
  };
  createdAt: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

// Helper to get ownerId from rental request (object or string)
function getOwnerId(owner: any): string {
  if (!owner) return '';
  if (typeof owner === 'string') return owner;
  if (typeof owner === 'object' && owner._id) return owner._id;
  return '';
}

const MyRentals: React.FC = () => {
  const [myRequests, setMyRequests] = useState<RentalRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [completeLoading, setCompleteLoading] = useState<string | null>(null);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentRental, setPaymentRental] = useState<RentalRequest | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [confirmPayment, setConfirmPayment] = useState(false);

  // Dispute modal state
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeRental, setDisputeRental] = useState<RentalRequest | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [disputeFile, setDisputeFile] = useState<File | null>(null);
  const [disputeFileUrl, setDisputeFileUrl] = useState<string>("");
  const [disputeError, setDisputeError] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [confirmDispute, setConfirmDispute] = useState(false);

  // Export/printable summary state
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const paymentDialogRef = useRef<HTMLDivElement>(null);
  const disputeDialogRef = useRef<HTMLDivElement>(null);

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

  const handleOpenPaymentDialog = (rental: RentalRequest) => {
    setPaymentRental(rental);
    setPaymentAmount(rental.listing.price ? String(rental.listing.price) : "");
    setPaymentMethod("Card"); // Default to Card
    setPaymentReference("");
    setPaymentError("");
    setPaymentDialogOpen(true);
  };
  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setPaymentRental(null);
    setPaymentError("");
  };
  const handlePayment = async () => {
    if (!paymentRental) return;
    if (!paymentAmount || !paymentMethod || !paymentReference) {
      setPaymentError("All fields are required.");
      return;
    }
    setConfirmPayment(false);
    setPaymentLoading(true);
    setPaymentError("");
    try {
      const result = await addRentalPayment(paymentRental._id, {
        amount: Number(paymentAmount),
        method: paymentMethod,
        reference: paymentReference,
      });
      if (result && !result.error) {
        fetchRequests();
        setPaymentDialogOpen(false);
        setSnackbar({ open: true, message: 'Payment successful!', severity: 'success' });
      } else {
        setPaymentError(result.error || "Failed to process payment");
        setSnackbar({ open: true, message: result.error || 'Failed to process payment', severity: 'error' });
      }
    } catch {
      setPaymentError("Network or server error. Please try again.");
      setSnackbar({ open: true, message: 'Network or server error. Please try again.', severity: 'error' });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleOpenDisputeDialog = (rental: RentalRequest) => {
    setDisputeRental(rental);
    setDisputeReason("");
    setDisputeEvidence("");
    setDisputeFile(null);
    setDisputeFileUrl("");
    setDisputeError("");
    setDisputeDialogOpen(true);
  };
  const handleCloseDisputeDialog = () => {
    setDisputeDialogOpen(false);
    setDisputeRental(null);
    setDisputeError("");
  };
  const handleDisputeSubmit = () => {
    setConfirmDispute(true);
  };
  const handleRaiseDispute = async () => {
    if (!disputeRental) return;
    if (!disputeReason) {
      setDisputeError("Reason is required.");
      return;
    }
    setConfirmDispute(false);
    setDisputeLoading(true);
    setDisputeError("");
    let evidenceUrl = disputeEvidence;
    try {
      if (disputeFile) {
        const formData = new FormData();
        formData.append('file', disputeFile);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Failed to upload evidence');
        const data = await res.json();
        evidenceUrl = data.url;
      }
      const result = await raiseDispute(disputeRental._id, { reason: disputeReason, evidenceUrl });
      if (result && !result.error) {
        fetchRequests();
        setDisputeDialogOpen(false);
        setDisputeFile(null);
        setDisputeFileUrl("");
        setSnackbar({ open: true, message: 'Dispute submitted successfully!', severity: 'success' });
      } else {
        setDisputeError(result.error || "Failed to raise dispute");
        setSnackbar({ open: true, message: result.error || 'Failed to raise dispute', severity: 'error' });
      }
    } catch (err) {
      setDisputeError("Network or server error. Please try again.");
      setSnackbar({ open: true, message: 'Network or server error. Please try again.', severity: 'error' });
    } finally {
      setDisputeLoading(false);
    }
  };

  const handleExportAudit = async (rentalId: string, format: 'pdf' | 'csv' | 'json') => {
    setExportLoading(rentalId + format);
    setExportError(null);
    try {
      const result = await exportRentalAudit(rentalId, format);
      if (format === 'pdf' || format === 'csv') {
        // Download file
        const url = window.URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rental_audit_${rentalId}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        // Show JSON in a new tab
        const jsonStr = JSON.stringify(result, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (err: any) {
      setExportError(err.message || 'Failed to export audit');
    } finally {
      setExportLoading(null);
    }
  };

  // PDF view handler
  const handleViewPdf = async (rentalId: string) => {
    try {
      setExportLoading(rentalId + 'pdf');
      setExportError(null);
      const token = localStorage.getItem("token");
      const url = `/api/rentals/${rentalId}/export?format=pdf`;
      // Open in new tab with auth header via blob workaround
      const res = await fetch(url, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      if (!res.ok) throw new Error("Failed to fetch PDF");
      const blob = await res.blob();
      const pdfUrl = window.URL.createObjectURL(blob);
      window.open(pdfUrl, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 10000);
    } catch (err) {
      setExportError("Failed to open PDF");
    } finally {
      setExportLoading(null);
    }
  };

  // Scroll to and highlight a rental if focus param is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const focusId = params.get('focus');
    if (focusId) {
      setTimeout(() => {
        const el = document.getElementById('rental-' + focusId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-rental-row');
          setTimeout(() => el.classList.remove('highlight-rental-row'), 2000);
        }
      }, 500);
    }
  }, [myRequests, incomingRequests]);

  useEffect(() => {
    if (paymentDialogOpen && paymentDialogRef.current) {
      paymentDialogRef.current.focus();
    }
  }, [paymentDialogOpen]);
  useEffect(() => {
    if (disputeDialogOpen && disputeDialogRef.current) {
      disputeDialogRef.current.focus();
    }
  }, [disputeDialogOpen]);

  const userId = getCurrentUserId();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Filter for active/in-progress rentals only
  const activeStatuses = ['pending', 'approved', 'paid', 'active', 'in-progress'];
  const filteredMyRequests = myRequests.filter(r => activeStatuses.includes(r.status));
  const filteredIncomingRequests = incomingRequests.filter(r => activeStatuses.includes(r.status));

  // Helper: calculate rental days and late days
  function getRentalInfo(req: RentalRequest) {
    const start = req.startDate ? new Date(req.startDate) : null;
    const end = req.endDate ? new Date(req.endDate) : null;
    const now = new Date();
    let days = 0, lateDays = 0, isLate = false;
    if (start && end) {
      days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (now > end && !["completed", "cancelled"].includes(req.status)) {
        isLate = true;
        lateDays = Math.ceil((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
      }
    }
    return { start, end, days, isLate, lateDays };
  }

  const renderRentalInfo = (req: RentalRequest) => {
    const { start, end, days, isLate, lateDays } = getRentalInfo(req);
    const pricePerDay = req.listing.price || 0;
    const basePrice = days * pricePerDay;
    // Example late fee: 20% extra per late day
    const lateFeePerDay = pricePerDay * 0.2;
    const lateFee = isLate ? lateDays * lateFeePerDay : 0;
    const total = basePrice + lateFee;
    return (
      <Box sx={{ fontSize: 14, color: '#555', mb: 1 }}>
        <b>Rental Period:</b> {start ? start.toLocaleDateString() : '-'} to {end ? end.toLocaleDateString() : '-'} ({days} days)<br />
        <b>Base Price:</b> ${basePrice.toFixed(2)} ({days} x ${pricePerDay.toFixed(2)}/day)<br />
        {isLate && (
          <span style={{ color: '#C62828', fontWeight: 600 }}>
            <b>Late!</b> {lateDays} day(s) late. Late fee: ${lateFee.toFixed(2)}
          </span>
        )}
        <br />
        <b>Total Due:</b> ${total.toFixed(2)}
      </Box>
    );
  };

  // Handler: Mark as Completed
  const handleMarkCompleted = async (rentalId: string) => {
    setCompleteLoading(rentalId);
    try {
      const userId = getCurrentUserId();
      const result = await updateRentalStatusWithAudit(rentalId, { status: "completed", userId });
      if (result && !result.error) {
        fetchRequests();
        setSnackbar({ open: true, message: 'Rental marked as completed!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: result.error || 'Failed to mark as completed', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Network or server error. Please try again.', severity: 'error' });
    } finally {
      setCompleteLoading(null);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '2.5em auto', padding: '0 1em', fontFamily: 'Inter, Arial, sans-serif' }}>
      {/* --- TRANSACTION FLOW START --- */}
      <h2 style={{ textAlign: 'center', color: '#FF9800', fontWeight: 800, marginBottom: '1.5em', letterSpacing: 1 }}>My Rental Activity</h2>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 16, color: '#1976D2' }}>
          Looking for completed/cancelled rentals?{' '}
          <Link to={`/profile/${userId}/transactions`}>View Transaction History</Link>
        </span>
      </div>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'space-between' }}>
        {/* Requests I Made */}
        <section style={{ flex: 1, minWidth: 340, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0001', padding: 24, marginBottom: 32 }}>
          <h3 style={{ color: '#FF9800', fontWeight: 700, marginBottom: 18, letterSpacing: 0.5 }}>Requests I Made</h3>
          {/* --- TRANSACTION FLOW: REQUEST TO RENT (START) --- */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
              <LinearProgress sx={{ width: '60%' }} aria-label="Loading your rental requests" />
            </Box>
          ) : (
            filteredMyRequests.length === 0 ? (
              <Box sx={{ textAlign: 'center', color: '#888', py: 4 }}>
                <NoDataSvg style={{ margin: '0 auto', display: 'block', maxWidth: 180 }} />
                <div style={{ marginTop: 18, fontSize: 17, color: '#888', fontWeight: 500 }}>No requests made yet.</div>
              </Box>
            ) : (
              isMobile ? (
                <Box>
                  {filteredMyRequests.map(req => (
                    <Box key={req._id} id={`rental-${req._id}`} sx={{ mb: 2, p: 2, borderRadius: 2, boxShadow: '0 2px 8px #0001', background: '#fff', border: '1px solid #eee', position: 'relative', transition: 'box-shadow 0.3s, border 0.3s', '&.highlight-rental-row': { boxShadow: '0 0 0 3px #FF9800', border: '2px solid #FF9800' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <DescriptionIcon sx={{ color: '#FF9800', mr: 1 }} />
                        {/* Defensive: Requests I Made (mobile) */}
                        <Link to={req.listing && req.listing._id ? `/listing/${req.listing._id}` : '#'} style={{ fontWeight: 700, color: '#1976D2', fontSize: 17, pointerEvents: req.listing && req.listing._id ? 'auto' : 'none', opacity: req.listing && req.listing._id ? 1 : 0.6 }}>
                          {req.listing && req.listing.title ? req.listing.title : 'Listing deleted'}
                        </Link>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#90caf9', fontSize: 15, mr: 1 }}>
                          {req.owner?.name ? req.owner.name[0].toUpperCase() : (req.owner?.email ? req.owner.email[0].toUpperCase() : '?')}
                        </Avatar>
                        <span style={{ fontWeight: 500 }}>{req.owner?.name || req.owner?.email || '-'}</span>
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Chip
                          label={req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          color={req.status === 'pending' ? 'warning' : req.status === 'approved' ? 'success' : req.status === 'declined' ? 'error' : req.status === 'paid' ? 'info' : req.status === 'completed' ? 'success' : 'default'}
                          variant={['pending','approved','paid','completed'].includes(req.status) ? 'filled' : 'outlined'}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: 15, px: 1.5, mr: 1 }}
                          aria-label={`Status: ${req.status}`}
                        />
                        {(req.status === 'approved' && !req.payment && (req.renter === userId || req.renter?._id === userId)) && (
                          <Button
                            variant="contained"
                            color="warning"
                            size="small"
                            sx={{ ml: 1, fontWeight: 700, borderRadius: 2, display: 'inline-block', verticalAlign: 'middle' }}
                            onClick={() => handleOpenPaymentDialog(req)}
                          >
                            Pay
                          </Button>
                        )}
                        {req.status === 'paid' && (
                          <span style={{ marginLeft: 12, color: '#388E3C', fontWeight: 700 }}>(Payment Completed)</span>
                        )}
                      </Box>
                      <Box sx={{ fontSize: 14, color: '#888', mb: 1 }}>
                        Requested: {new Date(req.createdAt).toLocaleString()}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Tooltip title="View PDF"><span><IconButton color="primary" size="small" onClick={() => handleViewPdf(req._id)} aria-label="View PDF"><PictureAsPdfIcon /></IconButton></span></Tooltip>
                        <Tooltip title="Download PDF"><span><IconButton color="primary" size="small" onClick={() => handleExportAudit(req._id, 'pdf')} disabled={exportLoading === req._id + 'pdf'} aria-label="Download PDF"><PictureAsPdfIcon /></IconButton></span></Tooltip>
                        <Tooltip title="Export CSV"><span><IconButton color="success" size="small" onClick={() => handleExportAudit(req._id, 'csv')} disabled={exportLoading === req._id + 'csv'} aria-label="Export CSV"><TableChartIcon /></IconButton></span></Tooltip>
                        <Tooltip title="Export JSON"><span><IconButton sx={{ color: '#FFA000' }} size="small" onClick={() => handleExportAudit(req._id, 'json')} disabled={exportLoading === req._id + 'json'} aria-label="Export JSON"><DescriptionIcon /></IconButton></span></Tooltip>
                        {exportError && (
                          <Tooltip title={exportError}><InfoOutlinedIcon sx={{ color: '#C62828', fontSize: 20, ml: 1 }} /></Tooltip>
                        )}
                      </Box>
                      {/* Rental period, price, and late info */}
                      {renderRentalInfo(req)}
                      {(["paid", "active", "in-progress"].includes(req.status) && ((req.owner?._id === userId) || (req.renter?._id === userId))) && (
                        <Tooltip title="Mark as Completed">
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            sx={{ ml: 1, fontWeight: 700, borderRadius: 2, mt: 1 }}
                            onClick={() => handleMarkCompleted(req._id)}
                            disabled={completeLoading === req._id}
                            aria-label="Mark as Completed"
                          >
                            <DoneAllIcon sx={{ fontSize: 18, mr: 0.5 }} /> {completeLoading === req._id ? 'Completing...' : 'Mark as Completed'}
                          </Button>
                        </Tooltip>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                  <thead>
                    <tr style={{ background: '#FFF3E0' }}>
                      <th style={{ textAlign: 'left', padding: 8 }}>Listing</th>
                      <th style={{ textAlign: 'left', padding: 8 }}>Owner</th>
                      <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                      <th style={{ textAlign: 'left', padding: 8 }}>Requested</th>
                      <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMyRequests.map(req => (
                      <tr key={req._id} id={`rental-${req._id}`} style={{ borderBottom: '1px solid #eee', background: '#fff' }}>
                        <td style={{ padding: 8 }}>
                          {req.listing && req.listing._id ? (
                            <Link to={`/listing/${req.listing._id}`}>{req.listing.title}</Link>
                          ) : (
                            <span style={{ color: '#888' }}>Listing deleted</span>
                          )}
                        </td>
                        <td style={{ padding: 8 }}>{req.owner?.name || req.owner?.email || '-'}</td>
                        <td style={{ padding: 8 }}>
                          <span style={{
                            background: req.status === 'pending' ? '#FFFDE7' : req.status === 'approved' ? '#C8E6C9' : '#FFCDD2',
                            color: req.status === 'pending' ? '#FF9800' : req.status === 'approved' ? '#388E3C' : '#C62828',
                            borderRadius: 8, padding: '4px 14px', fontWeight: 700, fontSize: 15
                          }}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span>
                          {(req.status === 'approved' && !req.payment && (req.renter === userId || req.renter?._id === userId)) && (
                            <Button
                              variant="contained"
                              color="warning"
                              size="small"
                              sx={{ ml: 1, fontWeight: 700, borderRadius: 2, display: 'inline-block', verticalAlign: 'middle' }}
                              onClick={() => handleOpenPaymentDialog(req)}
                            >
                              Pay
                            </Button>
                          )}
                          {req.status === 'paid' && (
                            <span style={{ marginLeft: 12, color: '#388E3C', fontWeight: 700 }}>(Payment Completed)</span>
                          )}
                        </td>
                        <td style={{ padding: 8 }}>{new Date(req.createdAt).toLocaleString()}</td>
                        <td style={{ padding: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {/* Export/Print actions */}
                            <Tooltip title="View PDF">
                              <button style={{ background: '#1976D2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleViewPdf(req._id)}>
                                <PictureAsPdfIcon sx={{ fontSize: 18, mr: 0.5 }} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Download PDF">
                              <button style={{ background: '#1976D2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleExportAudit(req._id, 'pdf')} disabled={exportLoading === req._id + 'pdf'}>
                                <PictureAsPdfIcon sx={{ fontSize: 18, mr: 0.5 }} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Export CSV">
                              <button style={{ background: '#388E3C', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleExportAudit(req._id, 'csv')} disabled={exportLoading === req._id + 'csv'}>
                                <TableChartIcon sx={{ fontSize: 18, mr: 0.5 }} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Export JSON">
                              <button style={{ background: '#FFA000', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleExportAudit(req._id, 'json')} disabled={exportLoading === req._id + 'json'}>
                                <DescriptionIcon sx={{ fontSize: 18, mr: 0.5 }} />
                              </button>
                            </Tooltip>
                            {exportError && (
                              <Tooltip title={exportError}><InfoOutlinedIcon sx={{ color: '#C62828', fontSize: 20, ml: 1 }} /></Tooltip>
                            )}
                            {/* Approve/Decline actions for pending requests, only for owner and not renter */}
                            {req.status === 'pending' && getOwnerId(req.owner) === userId && req.renter?._id !== userId && (
                              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <Tooltip title="Approve Request">
                                  <button
                                    style={{ background: '#388E3C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, fontSize: 16, cursor: actionLoading === req._id ? 'not-allowed' : 'pointer', opacity: actionLoading === req._id ? 0.7 : 1 }}
                                    onClick={() => handleApprove(req._id)}
                                    disabled={actionLoading === req._id}
                                  >
                                    {actionLoading === req._id ? 'Approving...' : 'Approve'}
                                  </button>
                                </Tooltip>
                                <Tooltip title="Decline Request">
                                  <button
                                    style={{ background: '#C62828', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, fontSize: 16, cursor: actionLoading === req._id ? 'not-allowed' : 'pointer', opacity: actionLoading === req._id ? 0.7 : 1 }}
                                    onClick={() => handleDecline(req._id)}
                                    disabled={actionLoading === req._id}
                                  >
                                    {actionLoading === req._id ? 'Declining...' : 'Decline'}
                                  </button>
                                </Tooltip>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )
          )}
          {/* --- TRANSACTION FLOW: REQUEST TO RENT (END) --- */}
        </section>
        {/* Requests for My Listings */}
        <section style={{ flex: 1, minWidth: 340, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0001', padding: 24, marginBottom: 32 }}>
          <h3 style={{ color: '#FF9800', fontWeight: 700, marginBottom: 18, letterSpacing: 0.5 }}>Requests for My Listings</h3>
          {/* --- TRANSACTION FLOW: OWNER ACTIONS (START) --- */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
              <LinearProgress sx={{ width: '60%' }} aria-label="Loading incoming rental requests" />
            </Box>
          ) : (
            filteredIncomingRequests.length === 0 ? (
              <Box sx={{ textAlign: 'center', color: '#888', py: 4 }}>
                <NoDataSvg style={{ margin: '0 auto', display: 'block', maxWidth: 180 }} />                <div style={{ marginTop: 18, fontSize: 17, color: '#888', fontWeight: 500 }}>No incoming requests yet.</div>
              </Box>
            ) : (
              isMobile ? (
                <Box>
                  {filteredIncomingRequests.map(req => (
                    <Box key={req._id} id={`rental-${req._id}`} sx={{ mb: 2, p: 2, borderRadius: 2, boxShadow: '0 2px 8px #0001', background: '#fff', border: '1px solid #eee', position: 'relative', transition: 'box-shadow 0.3s, border 0.3s', '&.highlight-rental-row': { boxShadow: '0 0 0 3px #FF9800', border: '2px solid #FF9800' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <DescriptionIcon sx={{ color: '#FF9800', mr: 1 }} />
                        {/* Defensive: Requests for My Listings (mobile) */}
                        <Link to={req.listing && req.listing._id ? `/listing/${req.listing._id}` : '#'} style={{ fontWeight: 700, color: '#1976D2', fontSize: 17, pointerEvents: req.listing && req.listing._id ? 'auto' : 'none', opacity: req.listing && req.listing._id ? 1 : 0.6 }}>
                          {req.listing && req.listing.title ? req.listing.title : 'Listing deleted'}
                        </Link>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#90caf9', fontSize: 15, mr: 1 }}>
                          {req.renter?.name ? req.renter.name[0].toUpperCase() : (req.renter?.email ? req.renter.email[0].toUpperCase() : '?')}
                        </Avatar>
                        <span style={{ fontWeight: 500 }}>{req.renter?.name || req.renter?.email || '-'}</span>
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Chip
                          label={req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          color={req.status === 'pending' ? 'warning' : req.status === 'approved' ? 'success' : req.status === 'declined' ? 'error' : req.status === 'paid' ? 'info' : req.status === 'completed' ? 'success' : 'default'}
                          variant={['pending','approved','paid','completed'].includes(req.status) ? 'filled' : 'outlined'}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: 15, px: 1.5, mr: 1 }}
                          aria-label={`Status: ${req.status}`}
                        />
                        {(req.status === 'approved' && !req.payment && (req.renter === userId || req.renter?._id === userId)) && (
                          <Tooltip title="Pay">
                            <Button
                              variant="contained"
                              color="warning"
                              size="small"
                              sx={{ ml: 1, fontWeight: 700, borderRadius: 2, display: 'inline-block', verticalAlign: 'middle' }}
                              onClick={() => handleOpenPaymentDialog(req)}
                              aria-label="Pay"
                            >
                              Pay
                            </Button>
                          </Tooltip>
                        )}
                        {req.status === 'paid' && (
                          <Tooltip title="Payment Completed">
                            <span style={{ color: '#388E3C', fontWeight: 700, display: 'flex', alignItems: 'center', marginLeft: 8 }}><DoneAllIcon sx={{ fontSize: 18, mr: 0.5 }} /> Paid</span>
                          </Tooltip>
                        )}
                      </Box>
                      <Box sx={{ fontSize: 14, color: '#888', mb: 1 }}>
                        Requested: {new Date(req.createdAt).toLocaleString()}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Tooltip title="View PDF"><span><IconButton color="primary" size="small" onClick={() => handleViewPdf(req._id)} aria-label="View PDF"><PictureAsPdfIcon /></IconButton></span></Tooltip>
                        <Tooltip title="Download PDF"><span><IconButton color="primary" size="small" onClick={() => handleExportAudit(req._id, 'pdf')} disabled={exportLoading === req._id + 'pdf'} aria-label="Download PDF"><PictureAsPdfIcon /></IconButton></span></Tooltip>
                        <Tooltip title="Export CSV"><span><IconButton color="success" size="small" onClick={() => handleExportAudit(req._id, 'csv')} disabled={exportLoading === req._id + 'csv'} aria-label="Export CSV"><TableChartIcon /></IconButton></span></Tooltip>
                        <Tooltip title="Export JSON"><span><IconButton sx={{ color: '#FFA000' }} size="small" onClick={() => handleExportAudit(req._id, 'json')} disabled={exportLoading === req._id + 'json'} aria-label="Export JSON"><DescriptionIcon /></IconButton></span></Tooltip>
                        {exportError && (
                          <Tooltip title={exportError}><InfoOutlinedIcon sx={{ color: '#C62828', fontSize: 20, ml: 1 }} /></Tooltip>
                        )}
                        {/* Approve/Decline actions for pending requests, only for owner and not renter */}
                        {req.status === 'pending' && getOwnerId(req.owner) === userId && req.renter?._id !== userId && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <Tooltip title="Approve Request">
                              <button
                                style={{ background: '#388E3C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, fontSize: 16, cursor: actionLoading === req._id ? 'not-allowed' : 'pointer', opacity: actionLoading === req._id ? 0.7 : 1 }}
                                onClick={() => handleApprove(req._id)}
                                disabled={actionLoading === req._id}
                              >
                                {actionLoading === req._id ? 'Approving...' : 'Approve'}
                              </button>
                            </Tooltip>
                            <Tooltip title="Decline Request">
                              <button
                                style={{ background: '#C62828', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, fontSize: 16, cursor: actionLoading === req._id ? 'not-allowed' : 'pointer', opacity: actionLoading === req._id ? 0.7 : 1 }}
                                onClick={() => handleDecline(req._id)}
                                disabled={actionLoading === req._id}
                              >
                                {actionLoading === req._id ? 'Declining...' : 'Decline'}
                              </button>
                            </Tooltip>
                          </div>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                  <thead>
                    <tr style={{ background: '#FFF3E0' }}>
                      <th style={{ textAlign: 'left', padding: 8 }}>Listing</th>
                      <th style={{ textAlign: 'left', padding: 8 }}>Renter</th>
                      <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                      <th style={{ textAlign: 'left', padding: 8 }}>Requested</th>
                      <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncomingRequests.map(req => (
                      <tr key={req._id} id={`rental-${req._id}`} style={{ borderBottom: '1px solid #eee', background: '#fff' }}>
                        <td style={{ padding: 8 }}>
                          {req.listing && req.listing._id ? (
                            <Link to={`/listing/${req.listing._id}`}>{req.listing.title}</Link>
                          ) : (
                            <span style={{ color: '#888' }}>Listing deleted</span>
                          )}
                        </td>
                        <td style={{ padding: 8 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: '#90caf9', fontSize: 15 }}>
                              {req.renter?.name ? req.renter.name[0].toUpperCase() : (req.renter?.email ? req.renter.email[0].toUpperCase() : '?')}
                            </Avatar>
                            <span>{req.renter?.name || req.renter?.email || '-'}</span>
                          </Box>
                        </td>
                        <td style={{ padding: 8 }}>
                          <Chip
                            label={req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            color={req.status === 'pending' ? 'warning' : req.status === 'approved' ? 'success' : req.status === 'declined' ? 'error' : req.status === 'paid' ? 'info' : req.status === 'completed' ? 'success' : 'default'}
                            variant={['pending','approved','paid','completed'].includes(req.status) ? 'filled' : 'outlined'}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: 15, px: 1.5, mr: 1 }}
                            aria-label={`Status: ${req.status}`}
                          />
                          {(req.status === 'approved' && !req.payment && (req.renter === userId || req.renter?._id === userId)) && (
                            <Button
                              variant="contained"
                              color="warning"
                              size="small"
                              sx={{ ml: 1, fontWeight: 700, borderRadius: 2 }}
                              onClick={() => handleOpenPaymentDialog(req)}
                            >
                              Pay
                            </Button>
                          )}
                          {req.status === 'paid' && (
                            <Tooltip title="Payment Completed">
                              <span style={{ color: '#388E3C', fontWeight: 700 }}>(Payment Completed)</span>
                            </Tooltip>
                          )}
                        </td>
                        <td style={{ padding: 8 }}>{new Date(req.createdAt).toLocaleString()}</td>
                        <td style={{ padding: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {/* Export/Print actions */}
                            <Tooltip title="View PDF">
                              <button style={{ background: '#1976D2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleViewPdf(req._id)}>
                                <PictureAsPdfIcon sx={{ fontSize: 18, mr: 0.5 }} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Download PDF">
                              <button style={{ background: '#1976D2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleExportAudit(req._id, 'pdf')} disabled={exportLoading === req._id + 'pdf'}>
                                <PictureAsPdfIcon sx={{ fontSize: 18, mr: 0.5 }} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Export CSV">
                              <button style={{ background: '#388E3C', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleExportAudit(req._id, 'csv')} disabled={exportLoading === req._id + 'csv'}>
                                <TableChartIcon sx={{ fontSize: 18, mr: 0.5 }} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Export JSON">
                              <button style={{ background: '#FFA000', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleExportAudit(req._id, 'json')} disabled={exportLoading === req._id + 'json'}>
                                <DescriptionIcon sx={{ fontSize: 18, mr: 0.5 }} />
                              </button>
                            </Tooltip>
                            {exportError && (
                              <Tooltip title={exportError}><InfoOutlinedIcon sx={{ color: '#C62828', fontSize: 20, ml: 1 }} /></Tooltip>
                            )}
                            {/* Approve/Decline actions for pending requests, only for owner and not renter */}
                            {req.status === 'pending' && getOwnerId(req.owner) === userId && req.renter?._id !== userId && (
                              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <Tooltip title="Approve Request">
                                  <button
                                    style={{ background: '#388E3C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, fontSize: 16, cursor: actionLoading === req._id ? 'not-allowed' : 'pointer', opacity: actionLoading === req._id ? 0.7 : 1 }}
                                    onClick={() => handleApprove(req._id)}
                                    disabled={actionLoading === req._id}
                                  >
                                    {actionLoading === req._id ? 'Approving...' : 'Approve'}
                                  </button>
                                </Tooltip>
                                <Tooltip title="Decline Request">
                                  <button
                                    style={{ background: '#C62828', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, fontSize: 16, cursor: actionLoading === req._id ? 'not-allowed' : 'pointer', opacity: actionLoading === req._id ? 0.7 : 1 }}
                                    onClick={() => handleDecline(req._id)}
                                    disabled={actionLoading === req._id}
                                  >
                                    {actionLoading === req._id ? 'Declining...' : 'Decline'}
                                  </button>
                                </Tooltip>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )
          )}
          {/* --- TRANSACTION FLOW: OWNER ACTIONS (END) --- */}
        </section>
      </div>
      {/* --- TRANSACTION FLOW END --- */}
      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={handleClosePaymentDialog} PaperProps={{ sx: { borderRadius: 3, minWidth: 350 } }} TransitionComponent={Grow}>
        <div ref={paymentDialogRef} tabIndex={-1} />
        <DialogTitle sx={{ fontWeight: 700, color: '#FF9800', fontSize: 22, letterSpacing: 0.5, pb: 0 }}>Pay for Rental</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <div style={{ marginBottom: 16, fontSize: 16, color: '#333' }}>
            <b>Listing:</b> <span style={{ color: '#1976D2', fontWeight: 600 }}>{paymentRental?.listing?.title}</span><br />
            <b>Amount:</b> <TextField size="small" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} sx={{ width: 120, ml: 1, background: '#FFFDE7', borderRadius: 1, fontWeight: 700 }} inputProps={{ min: 0, style: { fontWeight: 700 } }} />
          </div>
          <TextField
            label="Payment Method"
            size="small"
            select
            fullWidth
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            sx={{ mb: 2, background: '#F5F5F5', borderRadius: 1 }}
            SelectProps={{ native: true }}
          >
            <option value="Card">Card</option>
            <option value="M-Pesa">M-Pesa</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
          </TextField>
          <TextField label="Reference" size="small" fullWidth value={paymentReference} onChange={e => setPaymentReference(e.target.value)} sx={{ mb: 2, background: '#F5F5F5', borderRadius: 1 }} inputProps={{ maxLength: 32 }} />
          {paymentError && <Alert severity="error" sx={{ mb: 1 }}>{paymentError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 3 }}>
          <button onClick={handleClosePaymentDialog} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 6, padding: '7px 22px', fontWeight: 700, cursor: 'pointer', fontSize: 15, transition: 'background 0.2s' }}>Cancel</button>          <button
            onClick={() => setConfirmPayment(true)}
            disabled={paymentLoading}
            style={{ background: '#FF9800', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 22px', fontWeight: 700, cursor: paymentLoading ? 'not-allowed' : 'pointer', fontSize: 15, boxShadow: paymentLoading ? '0 0 0 2px #FF9800' : undefined, opacity: paymentLoading ? 0.7 : 1, transition: 'background 0.2s, opacity 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}
            title={paymentLoading ? 'Processing payment...' : ''}
          >
            {paymentLoading && <CircularProgress size={18} sx={{ color: '#fff' }} />} {paymentLoading ? 'Paying...' : 'Pay'}
          </button>
        </DialogActions>
      </Dialog>
      <Dialog open={confirmPayment} onClose={() => setConfirmPayment(false)}>
        <DialogTitle>Confirm Payment</DialogTitle>
        <DialogContent>Are you sure you want to pay for <b>{paymentRental?.listing?.title}</b>?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmPayment(false)}>Cancel</Button>
          <Button onClick={handlePayment} color="warning" variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onClose={handleCloseDisputeDialog} PaperProps={{ sx: { borderRadius: 3, minWidth: 350 } }} TransitionComponent={Grow}>
        <div ref={disputeDialogRef} tabIndex={-1} />
        <DialogTitle sx={{ fontWeight: 700, color: '#C62828', fontSize: 22, letterSpacing: 0.5, pb: 0 }}>Raise Dispute</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Alert severity="info" sx={{ mb: 2, fontSize: 15, alignItems: 'center', background: '#FFF3E0', color: '#C62828', borderRadius: 2 }}>
            <b>Disputes are for serious issues only.</b><br />
            Please describe the problem clearly and provide any evidence (such as a link to photos, documents, or upload a file). Our team will review your case and contact both parties.
          </Alert>
          <TextField label="Reason for Dispute" size="small" fullWidth value={disputeReason} onChange={e => setDisputeReason(e.target.value)} sx={{ mb: 2, background: '#FFFDE7', borderRadius: 1 }} multiline minRows={2} inputProps={{ maxLength: 200 }} />
          <TextField label="Evidence URL (optional)" size="small" fullWidth value={disputeEvidence} onChange={e => setDisputeEvidence(e.target.value)} sx={{ mb: 2, background: '#F5F5F5', borderRadius: 1 }} inputProps={{ maxLength: 200 }} />
          <Box sx={{ mb: 2 }}>
            <label htmlFor="dispute-file-upload">
              <InputAdornment position="start">
                <IconButton component="span" sx={{ color: '#1976D2' }}>
                  <CloudUploadIcon />
                </IconButton>
              </InputAdornment>
              <input
                id="dispute-file-upload"
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setDisputeFile(e.target.files[0]);
                    setDisputeFileUrl(e.target.files[0].name);
                  }
                }}
              />
              <span style={{ marginLeft: 8, color: '#1976D2', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                {disputeFileUrl ? `Attached: ${disputeFileUrl}` : 'Attach Evidence File (optional)'}
              </span>
            </label>
          </Box>
          {disputeError && <Alert severity="error" sx={{ mb: 1 }}>{disputeError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 3 }}>
          <button onClick={handleCloseDisputeDialog} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 6, padding: '7px 22px', fontWeight: 700, cursor: 'pointer', fontSize: 15, transition: 'background 0.2s' }}>Cancel</button>
          <button
            onClick={handleDisputeSubmit}
            disabled={disputeLoading}
            style={{ background: '#C62828', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 22px', fontWeight: 700, cursor: disputeLoading ? 'not-allowed' : 'pointer', fontSize: 15, boxShadow: disputeLoading ? '0 0 0 2px #C62828' : undefined, opacity: disputeLoading ? 0.7 : 1, transition: 'background 0.2s, opacity 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}
            title={disputeLoading ? 'Submitting dispute...' : ''}
          >
            {disputeLoading && <CircularProgress size={18} sx={{ color: '#fff' }} />} {disputeLoading ? 'Submitting...' : 'Submit Dispute'}
          </button>
        </DialogActions>
      </Dialog>
      <Dialog open={confirmDispute} onClose={() => setConfirmDispute(false)}>
        <DialogTitle>Confirm Dispute Submission</DialogTitle>
        <DialogContent>Are you sure you want to submit a dispute for <b>{disputeRental?.listing?.title}</b>?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDispute(false)}>Cancel</Button>
          <Button onClick={handleRaiseDispute} color="error" variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ zIndex: 1400 }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', fontWeight: 700, fontSize: 16 }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
      <style>{`
        button:focus {
          outline: 2px solid #FF9800;
          outline-offset: 2px;
        }
        .highlight-rental-row {
          box-shadow: 0 0 0 3px #FF9800 !important;
          border: 2px solid #FF9800 !important;
          transition: box-shadow 0.3s, border 0.3s;
        }
      `}</style>
    </div>
  );
};

export default MyRentals;
