import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import customerRoutes from './routes/customers';
import conversationRoutes from './routes/conversations';
import knowledgeRoutes from './routes/knowledge';
import dashboardRoutes from './routes/dashboard';
import aiRoutes from './routes/ai';
import healthRoutes from './routes/health';
import { initializeDatabase, seedDefaultAdmin } from './db';

dotenv.config();

export const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

void initializeDatabase()
  .then(() => seedDefaultAdmin())
  .then(({ email }) => {
    console.log(`Database ready. Seed admin: ${email}`);
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
  });

export default app;
