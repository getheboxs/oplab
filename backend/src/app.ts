import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import praktikumRoutes from "./routes/praktikum.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import rekapRoutes from "./routes/rekap.routes.js";
import publicRoutes from "./routes/public.routes.js";
import monitorRoutes from "./routes/monitor.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/admin", authRoutes);
app.use("/api/admin/praktikum", praktikumRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/rekap", rekapRoutes);
app.use("/api/admin/monitor", monitorRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/public", publicRoutes);

export default app;
