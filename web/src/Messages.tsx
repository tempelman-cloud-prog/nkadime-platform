import React, { useEffect, useState } from 'react';
import { getReceivedMessages, markMessagesRead, sendMessageReply, getListingMessages } from './api';
import { Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Badge, Dialog, DialogTitle, DialogContent, TextField, Button, CircularProgress } from '@mui/material';

const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState('');
  const [thread, setThread] = useState<any[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const msgs = await getReceivedMessages();
    setConversations(msgs);
  };

  const fetchThread = async (listingId: string, fromUserId: string) => {
    setThreadLoading(true);
    setThread([]);
    try {
      const allMsgs = await getListingMessages(listingId);
      const token = localStorage.getItem('token');
      let currentUserId = '';
      if (token) {
        try {
          const decoded: any = JSON.parse(atob(token.split('.')[1]));
          currentUserId = decoded.userId || decoded.id || '';
        } catch {}
      }
      // Helper to get id from string or object
      const getId = (u: any) => (typeof u === 'string' ? u : u?._id);
      const filtered = allMsgs.filter((m: any) => {
        const fromId = getId(m.fromUser);
        const toId = getId(m.toUser);
        return (
          (fromId === fromUserId && toId === currentUserId) ||
          (fromId === currentUserId && toId === fromUserId)
        );
      });
      setThread(filtered.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch {
      setThread([]);
    }
    setThreadLoading(false);
  };

  const handleOpen = async (conv: any) => {
    setSelected(conv);
    setOpen(true);
    setReply('');
    setReplyError('');
    setThread([]); // Clear previous thread
    setThreadLoading(true); // Show spinner immediately
    await markMessagesRead(conv.listing._id, conv.fromUser._id);
    fetchConversations();
    fetchThread(conv.listing._id, conv.fromUser._id);
  };

  const handleClose = () => {
    setOpen(false);
    setSelected(null);
    setReply('');
    setThread([]);
    setReplyError('');
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setReplyLoading(true);
    setReplyError('');
    // Optimistically add the reply to the thread
    const token = localStorage.getItem('token');
    let currentUserId = '';
    let currentUserName = 'You';
    if (token) {
      try {
        const decoded: any = JSON.parse(atob(token.split('.')[1]));
        currentUserId = decoded.userId || decoded.id || '';
        currentUserName = decoded.name || 'You';
      } catch {}
    }
    const optimisticMsg = {
      _id: `optimistic-${Date.now()}`,
      fromUser: { _id: currentUserId, name: currentUserName },
      toUser: selected.fromUser,
      message: reply,
      createdAt: new Date().toISOString(),
      read: false,
      optimistic: true
    };
    setThread(prev => [...prev, optimisticMsg]);
    setReply('');
    try {
      const res = await sendMessageReply(selected.listing._id, selected.fromUser._id, reply);
      if (res && !res.error) {
        // Replace the optimistic message with the real one
        setThread(prev => prev.map(m => m._id === optimisticMsg._id ? res : m));
        fetchConversations();
      } else {
        setReplyError(res.error || 'Failed to send reply');
        // Remove the optimistic message on error
        setThread(prev => prev.filter(m => m._id !== optimisticMsg._id));
      }
    } catch (e: any) {
      setReplyError(e.message || 'Failed to send reply');
      setThread(prev => prev.filter(m => m._id !== optimisticMsg._id));
    }
    setReplyLoading(false);
  };

  return (
    <Box maxWidth={600} mx="auto" mt={4}>
      <Typography variant="h4" gutterBottom>Messages</Typography>
      <List>
        {conversations.map(conv => (
          <ListItem button key={conv._id} onClick={() => handleOpen(conv)}>
            <ListItemAvatar>
              <Badge color="primary" badgeContent={conv.unreadCount || 0} invisible={!conv.unreadCount}>
                <Avatar src={conv.fromUser?.profilePic}>{conv.fromUser?.name?.[0]}</Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={conv.fromUser?.name || 'User'}
              secondary={<>
                <b>{conv.listing?.title}</b><br/>
                {conv.message}
              </>}
            />
          </ListItem>
        ))}
      </List>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Conversation</DialogTitle>
        <DialogContent>
          {selected && (
            <Box>
              <Typography variant="subtitle1"><b>Listing:</b> {selected.listing?.title}</Typography>
              <Typography variant="subtitle2"><b>With:</b> {selected.fromUser?.name}</Typography>
              <Box sx={{ my: 2, minHeight: 120, maxHeight: 260, overflowY: 'auto', bgcolor: '#f7f7f7', borderRadius: 2, p: 2 }}>
                {threadLoading ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress size={28} /></Box>
                ) : (!threadLoading && thread.length === 0) ? (
                  <Typography color="text.secondary">No messages yet.</Typography>
                ) : (
                  thread.map((msg, idx) => {
                    const fromId = typeof msg.fromUser === 'string' ? msg.fromUser : msg.fromUser?._id;
                    return (
                      <Box key={msg._id || idx} sx={{ mb: 2, p: 1, bgcolor: fromId === selected.fromUser._id ? '#FFF3E0' : '#E3F2FD', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: fromId === selected.fromUser._id ? '#FF9800' : '#1976d2' }}>
                          {fromId === selected.fromUser._id ? selected.fromUser?.name : 'You'}
                        </Typography>
                        <Typography variant="body1">{msg.message}</Typography>
                        <Typography variant="caption" color="text.secondary">{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}</Typography>
                      </Box>
                    );
                  })
                )}
              </Box>
              <TextField
                label="Reply"
                fullWidth
                multiline
                minRows={2}
                value={reply}
                onChange={e => setReply(e.target.value)}
                sx={{ my: 2 }}
                disabled={replyLoading}
              />
              {replyError && <Typography color="error" sx={{ mb: 1 }}>{replyError}</Typography>}
              <Button variant="contained" onClick={handleReply} disabled={!reply.trim() || replyLoading}>
                {replyLoading ? 'Sending...' : 'Send'}
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Messages;
export {};
