import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { createTradeController } from "../controllers/tradeController";
import { SimulationService } from "../services/simulationService";
import { SimulationEngine } from "../services/simulationEngine";

export function createTradeRoutes(engine: SimulationEngine) {
  const router = Router();
  const controller = createTradeController(new SimulationService(engine));

  router.use(verifyToken);
  router.get("/", controller.listTrades);
  router.post("/", controller.executeTrade);

  return router;
}
