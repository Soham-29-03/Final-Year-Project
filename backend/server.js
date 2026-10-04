import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

async function start() {
  try {
    await connectDB();
    
    app.listen(env.port, () => {
      console.log(`🚀 Server running in ${env.nodeEnv} mode on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

start();