import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { env } from "./config/env";
import { verifyJwt } from "./utils/jwt";
import { logger } from "./utils/logger";
import authRoutes from "./routes/authRoutes";
import { createSimulationRoutes } from "./routes/simulationRoutes";
import { createLiveMarketRoutes } from "./routes/liveMarketRoutes";
import { createPortfolioRoutes } from "./routes/portfolioRoutes";
import { createTradeRoutes } from "./routes/tradeRoutes";
import { createSymbolRoutes } from "./routes/symbolRoutes";
import { verifyToken } from "./middlewares/verifyToken";
import { createPortfolioController } from "./controllers/portfolioController";
import { SimulationEngine } from "./services/simulationEngine";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { requestLogger } from "./middlewares/requestLogger";

export function createApp() {
  const app = express();
  const httpServer = createServer(app);

  const allowedOrigins = Array.from(new Set([env.CLIENT_URL, ...env.CLIENT_URLS]));
  const corsOrigin: cors.CorsOptions["origin"] = (origin, callback) => {
    const isLocalhostOrigin =
      typeof origin === "string" && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

    // Allow non-browser requests (curl, server-to-server) and known browser origins.
    if (!origin || isLocalhostOrigin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  };

  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  const engine = new SimulationEngine(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      logger.warn("socket_unauthorized_missing_token");
      next(new Error("Unauthorized"));
      return;
    }
    try {
      const payload = verifyJwt(token);
      socket.data.userId = payload.userId;
      next();
    } catch (_error) {
      logger.warn("socket_unauthorized_invalid_token");
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(socket.data.userId);
  });

  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(requestLogger);

  const portfolioController = createPortfolioController();

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/upload-url", verifyToken, portfolioController.generateUploadUrl);

  app.use("/api/auth", authRoutes);
  app.use("/api/sim", createSimulationRoutes(engine));
  app.use("/api/simulation", createSimulationRoutes(engine));
  app.use("/api/live", createLiveMarketRoutes());
  app.use("/api/portfolio", createPortfolioRoutes());
  app.use("/api/trade", createTradeRoutes(engine));
  app.use("/api/symbols", createSymbolRoutes());
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, httpServer };
}
