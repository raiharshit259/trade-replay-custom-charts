import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { env } from "./config/env";
import { redisClient } from "./config/redis";
import { isKafkaEnabled, isKafkaReady } from "./config/kafka";
import { verifyJwt } from "./utils/jwt";
import { logger } from "./utils/logger";
import authRoutes from "./routes/authRoutes";
import { createSimulationRoutes } from "./routes/simulationRoutes";
import { createPortfolioRoutes } from "./routes/portfolioRoutes";
import { createTradeRoutes } from "./routes/tradeRoutes";
import { SimulationEngine } from "./services/simulationEngine";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { requestLogger } from "./middlewares/requestLogger";

export function createApp() {
  const app = express();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
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

  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json());
  app.use(requestLogger);

  app.get("/api/health", (_req, res) => {
    const mongoState = mongoose.connection.readyState;
    const mongoOk = mongoState === 1; // 1 = connected
    const redisOk = redisClient.isOpen;
    const kafkaOk = !isKafkaEnabled() || isKafkaReady();

    const status = mongoOk ? 200 : 503;
    res.status(status).json({
      ok: mongoOk,
      uptime: process.uptime(),
      services: {
        mongodb: mongoOk ? "connected" : "disconnected",
        redis: redisOk ? "connected" : "disconnected",
        kafka: !isKafkaEnabled() ? "disabled" : isKafkaReady() ? "connected" : "disconnected",
      },
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/sim", createSimulationRoutes(engine));
  app.use("/api/simulation", createSimulationRoutes(engine));
  app.use("/api/portfolio", createPortfolioRoutes());
  app.use("/api/trade", createTradeRoutes(engine));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, httpServer };
}
