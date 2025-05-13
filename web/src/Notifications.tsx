import React, { useEffect, useState } from "react";
import { getNotifications, markNotificationsRead } from "./api";
import jwt_decode from "jwt-decode";

interface JwtPayload { userId?: string; id?: string; email?: string; }

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to view notifications.");
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
    getNotifications(userId).then(nots => {
      setNotifications(nots);
      setLoading(false);
      // Mark all as read after fetching
      if (nots.some((n: any) => !n.read)) {
        markNotificationsRead(userId);
      }
    });
  }, []);

  if (loading) return <div>Loading notifications...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</div>;

  return (
    <div style={{ maxWidth: 600, margin: '2.5em auto', padding: '0 1em' }}>
      <h2 style={{ textAlign: 'center', color: '#FF9800', fontWeight: 700, marginBottom: '1.5em' }}>Notifications</h2>
      {notifications.length === 0 && <div style={{ textAlign: 'center', color: '#888' }}>No notifications yet.</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {notifications.map((n, idx) => (
          <li key={n._id || idx} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', marginBottom: 18, padding: '1.2em 1.5em', fontSize: 17, color: '#444', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontWeight: 700, color: '#FF9800', minWidth: 90 }}>{n.type}</span>
            <span style={{ flex: 1 }}>{n.message}</span>
            <span style={{ color: '#888', fontSize: 14 }}>{new Date(n.createdAt).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
