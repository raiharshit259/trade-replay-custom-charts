import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { googleLogin, loginUser, registerUser } from "../services/authService";
import { AppError } from "../utils/appError";
import { mapServiceError } from "../utils/serviceError";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleSchema = z.object({
  idToken: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  googleId: z.string().optional(),
});

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new AppError(400, "INVALID_REGISTER_PAYLOAD", "Invalid register payload"));
    return;
  }

  try {
    const payload = await registerUser(parsed.data);
    res.json(payload);
  } catch (error) {
    next(mapServiceError(error, "REGISTER_FAILED", "Registration failed"));
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new AppError(400, "INVALID_LOGIN_PAYLOAD", "Invalid login payload"));
    return;
  }

  try {
    const payload = await loginUser(parsed.data);
    res.json(payload);
  } catch (error) {
    next(mapServiceError(error, "LOGIN_FAILED", "Login failed"));
  }
}

export async function google(req: Request, res: Response, next: NextFunction): Promise<void> {
  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new AppError(400, "INVALID_GOOGLE_PAYLOAD", "Invalid Google payload"));
    return;
  }

  try {
    const payload = await googleLogin(parsed.data);
    res.json(payload);
  } catch (error) {
    next(mapServiceError(error, "GOOGLE_LOGIN_FAILED", "Invalid Google token"));
  }
}
