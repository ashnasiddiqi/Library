/* ──────────────────────────────────────────────────────────
 *  src/server.js   –  Express API for Library Lookup
 *  Adds strict CORS so the front-end on 3.142.173.109:3000
 *  can talk to this backend on 18.218.108.182:3000
 * ────────────────────────────────────────────────────────── */

import dotenv from "dotenv";
dotenv.config();                       // load .env first

import express from "express";
import cors    from "cors";
import bodyParser from "body-parser";

import bookRoutes    from "./routes/books.js";
import userRoutes    from "./routes/users.js";
import ratingRoutes  from "./routes/ratings.js";
import commentRoutes from "./routes/comments.js";

const app  = express();
const PORT = process.env.PORT || 3000;

/* ---------- CORS (allow only the React front-end) ---------- */
const FRONTEND_ORIGIN = "http://3.142.173.109:3000";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,          // allow cookies / auth headers
  })
);
/* ----------------------------------------------------------- */

console.log("🌍 ENV PORT :", process.env.PORT ?? "(none)");
console.log("✅ PORT used:", PORT);

// middleware
app.use(express.json());
app.use(bodyParser.json());

// routes
app.use("/api/books",    bookRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/ratings",  ratingRoutes);
app.use("/api/comments", commentRoutes);

// simple health check
app.get("/", (_, res) => res.send("📚 Library Lookup API is running!"));

// generic error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something broke!" });
});

// start server
app.listen(PORT, () =>
  console.log(`🚀  Backend listening on http://0.0.0.0:${PORT}`)
);
