import express from "express";
import {
  createListing,
  createlisting,
  getListings,
  getListingById,
  getMyListings,
  updateListing,
  deleteListing,
  deletListing,
  markAsSold,
  markasSold,
} from "../Controllers/listingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create listing (supports both REST "/" and legacy "/create")
router.post("/", protect, createListing);
router.post("/create", protect, createlisting);

// Current user's listings (defined before /:id parameter)
router.get("/my", protect, getMyListings);
router.get("/user/me", protect, getMyListings);

// Get all listings (supports both REST "/" and legacy "/get")
router.get("/", protect, getListings);
router.get("/get", protect, getListings);

// Mark listing as sold (supports both "/sold/:id" and "/:id/sold")
router.patch("/sold/:id", protect, markAsSold);
router.patch("/:id/sold", protect, markAsSold);
router.put("/:id/sold", protect, markAsSold);

// Get listing by ID (supports both REST "/:id" and legacy "/get/:id")
router.get("/:id", protect, getListingById);
router.get("/get/:id", protect, getListingById);

// Update listing (supports both PUT and PATCH)
router.put("/:id", protect, updateListing);
router.patch("/:id", protect, updateListing);

// Delete listing
router.delete("/:id", protect, deleteListing);

export default router;