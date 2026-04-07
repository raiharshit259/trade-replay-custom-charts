import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../utils/appError";
import { fetchSymbolFilters, mapCategoryToSymbolType, searchSymbols } from "../services/symbol.service";
import { mapServiceError } from "../utils/serviceError";

const searchSchema = z.object({
  query: z.string().default(""),
  type: z.string().optional(),
  country: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  category: z.string().optional(),
});

export function createSymbolController() {
  return {
    search: async (req: Request, res: Response, next: NextFunction) => {
      const parsed = searchSchema.safeParse(req.query);
      if (!parsed.success) {
        next(new AppError(400, "INVALID_SYMBOL_SEARCH_QUERY", "Invalid symbol search query"));
        return;
      }

      try {
        const resolvedType = parsed.data.type ?? mapCategoryToSymbolType(parsed.data.category);
        const payload = await searchSymbols({
          query: parsed.data.query,
          type: resolvedType,
          country: parsed.data.country,
          limit: parsed.data.limit,
          offset: parsed.data.offset,
        });

        res.json(payload);
      } catch (error) {
        next(mapServiceError(error, "SYMBOL_SEARCH_FAILED", "Could not search symbols"));
      }
    },

    filters: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const type = typeof req.query.type === "string" ? req.query.type : undefined;
        const payload = await fetchSymbolFilters(type);
        res.json(payload);
      } catch (error) {
        next(mapServiceError(error, "SYMBOL_FILTERS_FAILED", "Could not load symbol filters"));
      }
    },
  };
}
