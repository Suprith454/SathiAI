import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import itineraryRoutes from './routes/itinerary.js';
import unsplashRoutes from './routes/unsplash.js';
import weatherRoutes from './routes/weather.js';
import chatRoutes from './routes/chat.js';
import photosRoutes from './routes/photos.js';
import shareRoutes from './routes/share.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/temp', express.static(join(__dirname, '..', 'temp')));

app.use('/api', itineraryRoutes);
app.use('/api', unsplashRoutes);
app.use('/api', weatherRoutes);
app.use('/api', chatRoutes);
app.use('/api', photosRoutes);
app.use('/api', shareRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, _req, res, _next) => {
  console.error('Global error handler:', err?.message || err);
  res.status(err?.status || 500).json({
    error: err?.message || 'Internal server error',
  });
});

app.listen(config.port, () => {
  console.log(`SarthiAI backend running on port ${config.port}`);
});




