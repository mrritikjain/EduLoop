import mongoose from "mongoose";
import Listing from "../Models/Listing.js";
import User from "../Models/User.js";

export const createlisting = async (req, res) => {
  try {
    const { title, description, desc, category, price, condition, status } = req.body || {};
    const itemDescription = description || desc;
    const seller = req.user._id;
    const college = req.user.college;

    if (!title || !itemDescription || !category || price === undefined || !condition) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const newListing = await Listing.create({
      title,
      description: itemDescription,
      category,
      price: Number(price),
      condition,
      status: status || "Active",
      seller,
      college,
    });

    return res.status(201).json({ message: "Listing created successfully", newListing });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getListings = async (req, res) => {
  try {
    const userCollege = req.user?.college;
    // Status can come from query param (?status=Active) or request body, defaults to "Active"
    const status = req.query?.status || req.body?.status || "Active";

    const filter = { status };

    // Filter by college if user has a college or if passed as query parameter
    const collegeFilter = req.query?.college || userCollege;
    if (collegeFilter) {
      filter.college = collegeFilter;
    }

    const listings = await Listing.find(filter)
      .populate("seller", "name email college")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Listings fetched successfully",
      count: listings.length,
      listings,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing ID format" });
    }

    const foundListing = await Listing.findById(id).populate("seller", "name email college");
    if (!foundListing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    return res.status(200).json({ message: "Listing fetched successfully", listing: foundListing });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};