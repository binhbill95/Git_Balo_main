import app from "./app.js";
import env from "./config/env.js";

const server = app.listen(env.port, () => {
  console.log(`✅ API Server: http://localhost:${env.port}`);
  console.log(`📄 Swagger Docs: http://localhost:${env.port}/api/docs`);
  console.log(`🔗 Health: http://localhost:${env.port}/api/v1/system/health`);
});

const gracefulShutdown = () => {
  console.log("\n🛑 Shutting down server...");
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);