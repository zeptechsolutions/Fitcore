import app from './App.js';
import { config } from './config.js';
import { connectDatabase } from './database.js';

async function start() {
  try {
    await connectDatabase();
    app.listen(config.port, () => {
      console.log(`FitCore API running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
