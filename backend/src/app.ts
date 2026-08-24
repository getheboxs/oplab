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

const apiRouter = express.Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

apiRouter.use("/admin", authRoutes);
apiRouter.use("/admin/praktikum", praktikumRoutes);
apiRouter.use("/admin/dashboard", dashboardRoutes);
apiRouter.use("/admin/rekap", rekapRoutes);
apiRouter.use("/admin/monitor", monitorRoutes);
apiRouter.use("/admin/users", userRoutes);
apiRouter.use("/public", publicRoutes);

// Mount under both /api and root for maximum compatibility with Vercel serverless functions and standalone dev server
app.use("/api", apiRouter);
app.use("/", apiRouter);

export default app;
