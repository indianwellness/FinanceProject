import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic CORS configuration supporting local dev, Vercel deployments, and custom domains
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, health checks, curl)
    if (!origin) return callback(null, true);
    
    // Allow configured origins and any Vercel preview/production deployments
    const isAllowed = allowedOrigins.includes(origin) || 
      origin.endsWith('.vercel.app') ||
      origin.startsWith('http://localhost:');

    if (isAllowed) {
      return callback(null, true);
    }
    
    // In production, log warning but permit or restrict as desired
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Comprehensive health check endpoint (Render uses this for zero-downtime monitoring)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'MSME CreditOS Engine API', 
    version: '0.1.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Bind to 0.0.0.0 for cloud container compatibility (Render, Docker)
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`MSME CreditOS server listening on port ${PORT}`);
});

// Graceful shutdown handling for cloud restarts
process.on('SIGTERM', () => {
  console.log('SIGTERM received: shutting down HTTP server gracefully');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
