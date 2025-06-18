import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Badge, Dialog, DialogTitle, DialogContent, TextField, Button, CircularProgress } from '@mui/material';
import { useMessages, useConversations } from './MessagesContext';
import { getReceivedMessages, sendListingMessage, markMessagesRead, markUserMessagesRead } from './api';
import { useLocation } from 'react-router-dom';

const Messages: React.FC = () => {
  const { sendMessage } = useMessages();
  const { conversations, setConversations, resetUnread } = useConversations();
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState('');
  const [thread, setThread] = useState<any[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState('');
  const location = useLocation();

  // Fetch existing conversations/messages on mount
  useEffect(() => {
    let mounted = true;
    getReceivedMessages().then((data) => {
      if (!mounted) return;
      // Get current user ID
      const token = localStorage.getItem('token');
      let currentUserId = '';
      if (token) {
        try {
          const decoded: any = JSON.parse(atob(token.split('.')[1]));
          currentUserId = decoded.userId || decoded.id || '';
        } catch {}
      }
      // Group messages by conversationId
      const convMap: { [key: string]: any } = {};
      (data.messages || data).forEach((msg: any) => {
        const convId = msg.conversationId || msg._id || msg.listing?._id || msg.listingId;
        if (!convId) return;
        // The other user is the one who is NOT the current user
        let otherUser = (msg.fromUser && (msg.fromUser._id || msg.fromUser.id || msg.fromUser)) === currentUserId ? msg.toUser : msg.fromUser;
        if (!convMap[convId]) {
          convMap[convId] = {
            _id: convId,
            message: msg.message,
            updatedAt: msg.createdAt,
            unreadCount: msg.unreadCount || 0,
            thread: [msg],
            fromUser: otherUser, // always the other user
            listing: msg.listing,
          };
        } else {
          convMap[convId].thread.push(msg);
          // Optionally update latest message/updatedAt
          if (new Date(msg.createdAt) > new Date(convMap[convId].updatedAt)) {
            convMap[convId].message = msg.message;
            convMap[convId].updatedAt = msg.createdAt;
          }
        }
      });
      // Sort conversations by updatedAt desc
      const convArr = Object.values(convMap).sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setConversations(convArr);
    }).catch(() => {
      setConversations([]);
    });
    return () => { mounted = false; };
  }, [setConversations]);

  // Add missing handlers
  const handleOpen = async (conv: any) => {
    setSelected(conv);
    setOpen(true);
    setThreadLoading(true);
    setThread(conv.thread || []); // Replace with real fetch if needed
    setThreadLoading(false);
    // Mark conversation as read in backend and context
    if (conv.listing?._id || conv.listingId) {
      try {
        await markMessagesRead(conv.listing._id || conv.listingId, conv.fromUser?._id || conv.fromUser?.id || conv.fromUser);
      } catch {}
    } else if (conv.fromUser?._id || conv.fromUser?.id || conv.fromUser) {
      try {
        await markUserMessagesRead(conv.fromUser._id || conv.fromUser.id || conv.fromUser);
      } catch {}
    }
    setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, unreadCount: 0 } : c));
  };

  const handleClose = () => {
    setOpen(false);
    setSelected(null);
    setThread([]);
    setReply('');
    setReplyError('');
  };

  // Mark all as read when /messages is opened
  useEffect(() => {
    if (location.pathname === '/messages') {
      resetUnread();
    }
  }, [location.pathname, resetUnread]);

  const handleReply = useCallback(async () => {
    if (!reply.trim() || !selected || replyLoading) return;
    setReplyLoading(true);
    setReplyError('');
    const token = localStorage.getItem('token');
    let currentUserId = '';
    if (token) {
      try {
        const decoded: any = JSON.parse(atob(token.split('.')[1]));
        currentUserId = decoded.userId || decoded.id || '';
      } catch {}
    }
    let recipientId = '';
    if (thread && thread.length > 0) {
      // Find all unique user IDs in the thread (fromUser and toUser)
      const userIds = new Set<string>();
      thread.forEach(m => {
        if (m.fromUser?._id || m.fromUser?.id || m.fromUser) userIds.add(m.fromUser._id || m.fromUser.id || m.fromUser);
        if (m.toUser?._id || m.toUser?.id || m.toUser) userIds.add(m.toUser._id || m.toUser.id || m.toUser);
      });
      userIds.delete(currentUserId);
      recipientId = Array.from(userIds)[0];
    } else {
      // Use selected.fromUser and selected.toUser
      const fromId = selected.fromUser?._id || selected.fromUser?.id || selected.fromUser;
      const toId = selected.toUser?._id || selected.toUser?.id || selected.toUser;
      if (fromId !== currentUserId) recipientId = fromId;
      else if (toId !== currentUserId) recipientId = toId;
    }
    if (!recipientId || recipientId === currentUserId) {
      setReplyError('No valid recipient found.');
      setReplyLoading(false);
      return;
    }
    let savedMsg: any = null;
    // If this is a listing conversation, persist to backend
    if (selected.listing?._id || selected.listingId || selected.type === 'listing') {
      try {
        savedMsg = await sendListingMessage(
          selected.listing?._id || selected.listingId || selected._id,
          reply,
          recipientId
        );
      } catch (e: any) {
        setReplyError(e.message || 'Failed to send message');
        setReplyLoading(false);
        return;
      }
    }
    // Broadcast via WebSocket
    sendMessage({
      fromUser: currentUserId,
      toUser: recipientId,
      message: reply,
      conversationId: selected._id
    });
    // Optimistically update conversations preview for sender's navbar
    setConversations(prev => {
      return prev.map(conv =>
        conv._id === selected._id
          ? { ...conv, message: reply, unreadCount: 0, updatedAt: new Date().toISOString() }
          : conv
      );
    });
    // Optimistically append to thread
    setThread(prev => [
      ...prev,
      savedMsg ? {
        _id: savedMsg._id,
        fromUser: savedMsg.fromUser,
        toUser: savedMsg.toUser,
        message: savedMsg.message,
        createdAt: savedMsg.createdAt,
        conversationId: savedMsg.listing?._id || savedMsg.listing || selected._id
      } : {
        _id: `msg-${Date.now()}`,
        fromUser: currentUserId,
        toUser: recipientId,
        message: reply,
        createdAt: new Date().toISOString(),
        conversationId: selected._id
      }
    ]);
    setReply('');
    setTimeout(() => setReplyLoading(false), 400); // Prevent double send
  }, [reply, selected, sendMessage, replyLoading, setConversations, thread]);

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
              secondary={
                <>
                  <b>{conv.listing?.title}</b><br/>
                  {conv.message}
                </>
              }
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
              <Box style={{ margin: '16px 0', minHeight: 120, maxHeight: 260, overflowY: 'auto', background: '#f7f7f7' }}>
                {threadLoading ? (
                  <Box style={{ textAlign: 'center', padding: '24px 0' }}><CircularProgress size={28} /></Box>
                ) : (!threadLoading && thread.length === 0) ? (
                  <Typography color="text.secondary">No messages yet.</Typography>
                ) : (
                  <>
                    {thread.map((msg: any, idx: number) => {
                      const fromId = typeof msg.fromUser === 'string' ? msg.fromUser : msg.fromUser?._id;
                      return (
                        <Box key={msg._id || idx} style={{ marginBottom: 8, padding: 8, background: fromId === selected.fromUser._id ? '#FFF3E0' : '#E3F2FD', borderRadius: 4 }}>
                          <Typography variant="body2" style={{ fontWeight: 700, color: fromId === selected.fromUser._id ? '#FF9800' : '#1976d2' }}>
                            {fromId === selected.fromUser._id ? selected.fromUser?.name : 'You'}
                          </Typography>
                          <Typography variant="body1">{msg.message}</Typography>
                          <Typography variant="caption" color="text.secondary">{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}</Typography>
                        </Box>
                      );
                    })}
                  </>
                )}
              </Box>
              <TextField
                label="Reply"
                fullWidth
                multiline
                minRows={2}
                value={reply}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReply(e.target.value)}
                style={{ margin: '16px 0' }}
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
