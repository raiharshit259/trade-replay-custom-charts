import { AuthenticatedRequest } from "../types/auth";
import { AppError } from "./appError";

export function requireUserId(req: AuthenticatedRequest): string {
  if (!req.user?.userId) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return req.user.userId;
}
