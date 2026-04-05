import { NextFunction, Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../types/auth";
import { SimulationService } from "../services/simulationService";
import { AppError } from "../utils/appError";
import { requireUserId } from "../utils/request";
import { mapServiceError } from "../utils/serviceError";

const tradeSchema = z.object({ type: z.enum(["BUY", "SELL"]), quantity: z.number().int().positive() });

export function createTradeController(service: SimulationService) {
  return {
    executeTrade: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const userId = requireUserId(req);
      const parsed = tradeSchema.safeParse(req.body);
      if (!parsed.success) {
        next(new AppError(400, "INVALID_TRADE_PAYLOAD", "Invalid trade payload"));
        return;
      }
      try {
        res.json(await service.executeTrade(userId, parsed.data));
      } catch (error) {
        next(mapServiceError(error, "TRADE_FAILED", "Trade failed"));
      }
    },

    listTrades: async (req: AuthenticatedRequest, res: Response) => {
      const userId = requireUserId(req);
      res.json(await service.getTrades(userId));
    },
  };
}
