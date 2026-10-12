import {createlisting, getListings, getListingById} from "../Controllers/listingController.js";
import express from "express";
import {protect} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create",protect,createlisting);
router.get("/get",protect,getListings);
router.get("/get/:id",protect,getListingById);

export default router;