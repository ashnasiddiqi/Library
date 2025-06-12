import dotenv from "dotenv";
dotenv.config(); // Explicitly load the .env file first

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import bookRoutes from "./routes/books.js";
import userRoutes from "./routes/users.js";
import ratingRoutes from "./routes/ratings.js";
import commentRoutes from "./routes/comments.js";

const app = express();
const PORT = process.env.PORT || 3000;

console.log("🌍 ENV PORT:", process.env.PORT); // Debug
console.log("✅ Final PORT used:", PORT);       // Debug

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Routes
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/comments", commentRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// Test route
app.get("/", (req, res) => {
  res.send("📚 Library Lookup API is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
