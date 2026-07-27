import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import praktikumRoutes from "./routes/praktikum.routes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/admin", authRoutes);
app.use("/api/admin/praktikum", praktikumRoutes);

export default app;
