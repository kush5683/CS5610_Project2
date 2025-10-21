import { Router } from "express";
import mongoDB from "../db/mongoDB.js";
import fs from "fs";
import path from "path";

const router = Router();
const db = mongoDB(); // Initialize MongoDB connection

// Load movies data
let moviesData = [];
let seriesData = [];
try {
  const moviesPath = path.join(process.cwd(), "movies.json");
  const moviesFile = fs.readFileSync(moviesPath, "utf8");
  moviesData = JSON.parse(moviesFile);
  console.log(`Loaded ${moviesData.length} movies from movies.json`);
} catch (error) {
  console.error("Error loading movies.json:", error);
}

try {
  const seriesPath = path.join(process.cwd(), "tv_shows.json");
  const seriesFile = fs.readFileSync(seriesPath, "utf8");
  seriesData = JSON.parse(seriesFile);
  console.log(`Loaded ${seriesData.length} series from tv_shows.json`);
} catch (error) {
  console.error("Error loading tv_shows.json:", error);
}

console.log("Data JS loaded successfully.");

router.get("/get-random-movie", async (_, res) => {
  try {
    console.log("Get random movie endpoint hit");

    const randomSelection = await db.getRandomMovie();
    console.log("Random movie selected:", randomSelection);
    res.json(randomSelection);
  } catch (error) {
    console.error("Get random move error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/movies", async (req, res) => {
  try {
    console.log("Movies endpoint hit");
    const page = req.query.page ?? 1;
    const pageSize = req.query.pageSize ?? 50;

    const moviePage = await db.getMoviePage(page, pageSize);
    console.log("Movies page response:", moviePage);

    res.json(moviePage);
  } catch (error) {
    console.error("Error getting movies page:", error);
    res.status(500).json({ error: "Failed to get movies" });
  }
});

router.get("/series", async (req, res) => {
  try {
    console.log("Series endpoint hit");
    const page = req.query.page ?? 1;
    const pageSize = req.query.pageSize ?? 50;

    const seriesPage = await db.getSeriesPage(page, pageSize);
    console.log("Series page response:", seriesPage);

    res.json(seriesPage);
  } catch (error) {
    console.error("Error getting series page:", error);
    res.status(500).json({ error: "Failed to get series" });
  }
});

// Using plain text passwords is an issue, we need to use import bcrypt from 'bcrypt';
// User authentication routes using MongoDB
router.post("/register-user", async (req, res) => {
  try {
    console.log("Register user endpoint hit");
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Email, password, and name are required" });
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Create new user
    const result = await db.addUser({ email, password, name });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      userId: result.insertedId,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth-user", async (req, res) => {
  try {
    console.log("Auth user endpoint hit");
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await db.getUserByEmail(email);

    if (user && user.password === password) {
      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Watchlist routes using MongoDB
router.get("/get-user-watchlist", async (req, res) => {
  try {
    console.log("Get user watchlist endpoint hit");
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const watchlist = await db.getWatchlist(userId);
    res.json(watchlist);
  } catch (error) {
    console.error("Get watchlist error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/add-to-user-watchlist", async (req, res) => {
  try {
    console.log("Add to watchlist endpoint hit");
    console.log("Request body:", req.body);
    const { userId, movie } = req.body;

    if (!userId || !movie) {
      console.log("Missing userId or movie:", {
        userId: !!userId,
        movie: !!movie,
      });
      return res.status(400).json({ error: "User ID and movie are required" });
    }

    console.log("Calling db.addToWatchlist with:", {
      userId,
      movieTitle: movie.title,
    });
    const result = await db.addToWatchlist(userId, movie);
    console.log("Database result:", result);
    res
      .status(201)
      .json({ success: true, message: "Movie added to watchlist" });
  } catch (error) {
    console.error("Add to watchlist error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/remove-from-user-watchlist", async (req, res) => {
  try {
    console.log("Remove from watchlist endpoint hit");
    const { userId, movieId } = req.body;

    if (!userId || !movieId) {
      return res
        .status(400)
        .json({ error: "User ID and movie ID are required" });
    }

    await db.removeFromWatchlist(userId, movieId);
    res.json({ success: true, message: "Movie removed from watchlist" });
  } catch (error) {
    console.error("Remove from watchlist error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
