import { Router } from "express";

const router = Router();

console.log("Data JS loaded successfully.");

router.get("/get-random-movie", (req, res) => {
  //TODO: Replace with actual random movie fetching logic
  res.json({
    id: 617126,
    title: "The Fantastic 4: First Steps",
    overview:
      "Against the vibrant backdrop of a 1960s-inspired, retro-futuristic world, Marvel's First Family is forced to balance their roles as heroes with the strength of their family bond, while defending Earth from a ravenous space god called Galactus and his enigmatic Herald, Silver Surfer.",
    poster_path:
      "https://image.tmdb.org/t/p/w500/cm8TNGBGG0aBfWj0LgrESHv8tir.jpg",
    release_date: "2025-07-22",
    vote_count: 1780,
    providers: [
      {
        name: "Amazon Video",
        logo_path:
          "https://image.tmdb.org/t/p/w500/seGSXajazLMCKGB5hnRCidtjay1.jpg",
      },
      {
        name: "Apple TV",
        logo_path:
          "https://image.tmdb.org/t/p/w500/9ghgSC0MA082EL6HLCW3GalykFD.jpg",
      },
      {
        name: "Fandango At Home",
        logo_path:
          "https://image.tmdb.org/t/p/w500/19fkcOz0xeUgCVW8tO85uOYnYK9.jpg",
      },
    ],
  });
});

router.get("/auth-user", (req, res) => {
  console.log("Auth user endpoint hit");
  console.log(req.body);
  res.sendStatus(200);
});

router.post("/register-user", (req, res) => {
  console.log("Register user endpoint hit");
  console.log(req.body);
  res.sendStatus(201);
});

router.get("/get-user-watchlist", (req, res) => {
  console.log("Get user watchlist endpoint hit");
  res.json([]);
});

router.post("/add-to-user-watchlist", (req, res) => {
  console.log("Add to watchlist endpoint hit");
  console.log(req.body);
  res.sendStatus(201);
});

router.delete("/remove-from-user-watchlist", (req, res) => {
  console.log("Remove from watchlist endpoint hit");
  res.sendStatus(200);
});

export default router;
