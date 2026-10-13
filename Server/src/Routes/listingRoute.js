import {createlisting, getListings, getListingById,updateListing,deletListing,markasSold} from "../Controllers/listingController.js";
import express from "express";
import {protect} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create",protect,createlisting);
router.get("/get",protect,getListings);
router.get("/get/:id",protect,getListingById);
router.patch("/:id",protect,updateListing);
router.delete("/:id",protect,deletListing);
router.patch("/sold/:id",protect,markasSold);
export default router;