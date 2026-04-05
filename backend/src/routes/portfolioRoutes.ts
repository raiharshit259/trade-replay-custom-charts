import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { createPortfolioController, portfolioCsvUploadMiddleware } from "../controllers/portfolioController";

export function createPortfolioRoutes() {
  const router = Router();
  const controller = createPortfolioController();

  router.use(verifyToken);
  router.get("/current", controller.getCurrentPortfolio);
  router.get("/", controller.listSaved);
  router.get("/:portfolioId", controller.getById);
  router.post("/", controller.create);
  router.put("/:portfolioId", controller.update);
  router.post("/import", portfolioCsvUploadMiddleware, controller.importCsv);

  return router;
}
