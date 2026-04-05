import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../utils/jwt";
import { AppError } from "../utils/appError";
import { AuthenticatedRequest } from "../types/auth";

type TypedRequest = Request & AuthenticatedRequest;

export function verifyToken(req: TypedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new AppError(401, "MISSING_TOKEN", "Missing token"));
    return;
  }

  const token = authHeader.slice(7).trim();
  try {
    const decoded = verifyJwt(token);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    next();
  } catch (_error) {
    next(new AppError(401, "INVALID_TOKEN", "Invalid token"));
  }
}
