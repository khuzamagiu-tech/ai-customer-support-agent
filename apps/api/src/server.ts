import dotenv from 'dotenv';
import app from './app';
import { env } from './config/env';

dotenv.config();

const port = env.port;

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
