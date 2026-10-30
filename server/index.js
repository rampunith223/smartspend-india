import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import overviewRoutes from './routes/overview.js';
import budgetRoutes from './routes/budgets.js';
import recurringRoutes from './routes/recurring.js';
import goalRoutes from './routes/goals.js';
import reportRoutes from './routes/reports.js';
import pushRoutes from './routes/push.js';
import { connectDB } from './db.js';
import { ApiError } from './lib/http.js';
import { startReminderScheduler } from './lib/push.js';
import { seedDemo } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const app = express();
const port = Number(process.env.PORT) || 4000;
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            fontSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 400,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down and try again.' },
});
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'smartspend-india', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/push', pushRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

const distPath = path.join(projectRoot, 'dist');
if (fs.existsSync(path.join(distPath, 'index.html'))) {
  app.use(
    express.static(distPath, {
      maxAge: isProduction ? '1y' : 0,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    }),
  );
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    return res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message, details: err.details || undefined });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'The request body was not valid JSON.' });
    return;
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our side. Please try again.' });
});

async function start() {
  if (isProduction && !process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not set. Set a long random secret before deploying.');
  }

  await connectDB();

  try {
    const seeded = await seedDemo();
    if (seeded.seeded) {
      console.log(`Demo account ready: ${seeded.email} / ${seeded.password}`);
    }
  } catch (error) {
    console.error('Could not prepare the demo account:', error.message);
  }

  app.listen(port, () => {
    console.log(`SmartSpend India API listening on http://localhost:${port}`);
    if (!isProduction) console.log('Run the Vite dev server with: npm run dev:web');
    startReminderScheduler();
  });
}

start();
