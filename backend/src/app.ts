import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import routes from './routes';
import path from 'path';
import * as WebSocket from 'ws'; // Import WebSocket module

dotenv.config();

if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI environment variable is required');
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Routes
app.use('/api', routes);

// 404 handler for API routes
app.use('/api', (req: express.Request, res: express.Response) => {
  console.log('404 API route not found:', req.method, req.originalUrl);
  res.status(404).json({ error: 'API route not found' });
});

// Global error handler for API routes
app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Create HTTP server for WebSocket
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Create WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

const userSockets = new Map<string, WebSocket.WebSocket>(); // userId -> ws

// Handle WebSocket connections
wss.on('connection', (ws) => {
    let userId: string | null = null;

    ws.on('message', (message: WebSocket.RawData) => {
        try {
            const data = JSON.parse(message.toString());
            if (data.type === 'auth') {
                userId = data.userId;
                if (typeof userId === 'string') {
                  userSockets.set(userId, ws);
                }
                return;
            }
            // For chat messages:
            if (data.type === 'message') {
                const { fromUser, toUser } = data;
                // Send to sender
                if (userSockets.has(fromUser)) {
                    userSockets.get(fromUser)!.send(JSON.stringify(data));
                }
                // Send to recipient
                if (userSockets.has(toUser) && toUser !== fromUser) {
                    userSockets.get(toUser)!.send(JSON.stringify(data));
                }
            }
        } catch (e) {
            // handle error
        }
    });

    ws.on('close', () => {
        if (userId && typeof userId === 'string') userSockets.delete(userId);
        console.log('Client disconnected');
    });
});