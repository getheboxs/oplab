import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  id_admin: number;
  username: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AuthPayload;
    }
  }
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token otorisasi tidak ditemukan." });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET ?? "dev_secret"
    ) as AuthPayload;
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa." });
  }
}
