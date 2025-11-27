import express from "express";
import http from "http";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { PORT } from "./config.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import adminRoutes from "./routes/admin.js";
import matchmakingRoutes from "./routes/matchmaking.js";
import storeRoutes from "./routes/store.js";
import statsRoutes from "./routes/stats.js";
import { setupSockets } from "./sockets/index.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/matchmaking", matchmakingRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/stats", statsRoutes);

const clientDir = path.join(__dirname, "..", "client");
app.use(express.static(clientDir));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*"
  }
});

setupSockets(io);

server.listen(PORT, () => {
  console.log(`Arena Nemesis listening on port ${PORT}`);
});
