import mongoose from "mongoose";
import Listing from "../Models/Listing.js";

// Helper to normalize category against enum
const normalizeCategory = (category) => {
  if (!category) return category;
  const validCategories = ["Books", "Notes", "Stationary", "Tools", "Accessories", "Others"];
  const trimmed = category.toString().trim();
  const matched = validCategories.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (matched) return matched;
  if (trimmed.toLowerCase() === "stationery") return "Stationary";
  return trimmed;
};

// Helper to normalize condition against enum
const normalizeCondition = (condition) => {
  if (!condition) return condition;
  const validConditions = ["New", "Used", "Like New"];
  const trimmed = condition.toString().trim();
  const matched = validConditions.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  return matched || trimmed;
};

export const createListing = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authorized, user missing" });
    }

    const { title, description, desc, category, price, condition, status, college: bodyCollege } =
      req.body || {};
    const itemDescription = description || desc;
    const seller = req.user._id;
    const college = bodyCollege?.trim() || req.user.college?.trim() || "";

    if (!title || !itemDescription || !category || price === undefined || price === null || price === "" || !condition) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: "Price must be a valid non-negative number" });
    }

    const normalizedCat = normalizeCategory(category);
    const normalizedCond = normalizeCondition(condition);

    const newListing = await Listing.create({
      title: title.trim(),
      description: itemDescription.trim(),
      category: normalizedCat,
      price: numericPrice,
      condition: normalizedCond,
      status: status || "Active",
      seller,
      college,
    });

    await newListing.populate("seller", "name email college");

    return res.status(201).json({
      message: "Listing created successfully",
      listing: newListing,
      newListing,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Alias for backwards compatibility
export const createlisting = createListing;

export const getListings = async (req, res) => {
  try {
    const userCollege = req.user?.college;
    const {
      status,
      college,
      allColleges,
      category,
      condition,
      search,
      seller,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query || {};

    const filter = {};

    // Status filter (defaults to "Active" unless specified as "all" or specific status)
    if (status) {
      if (status !== "all" && status !== "*") {
        filter.status = status;
      }
    } else {
      filter.status = "Active";
    }

    // College filter
    if (college) {
      if (college !== "all" && college !== "*") {
        filter.college = { $regex: new RegExp(`^${college.trim()}$`, "i") };
      }
    } else if (allColleges !== "true" && userCollege) {
      filter.college = userCollege;
    }

    // Category filter
    if (category && category !== "all") {
      filter.category = normalizeCategory(category);
    }

    // Condition filter
    if (condition && condition !== "all") {
      filter.condition = normalizeCondition(condition);
    }

    // Seller filter
    if (seller) {
      if (mongoose.Types.ObjectId.isValid(seller)) {
        filter.seller = seller;
      }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && !isNaN(Number(minPrice))) {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // Search filter (keyword in title or description)
    if (search && search.trim() !== "") {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // Sorting
    const sortField = ["price", "createdAt", "title"].includes(sortBy) ? sortBy : "createdAt";
    const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;

    const listings = await Listing.find(filter)
      .populate("seller", "name email college")
      .sort({ [sortField]: sortDirection });

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

    return res.status(200).json({
      message: "Listing fetched successfully",
      listing: foundListing,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMyListings = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authorized, user missing" });
    }

    const listings = await Listing.find({ seller: req.user._id })
      .populate("seller", "name email college")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "My listings fetched successfully",
      count: listings.length,
      listings,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateListing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing ID format" });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Ownership check: only seller can update their listing
    if (!req.user || listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this listing" });
    }

    const { title, description, desc, category, price, condition, status, college } = req.body || {};
    const itemDescription = description || desc;

    if (title !== undefined) listing.title = title.trim();
    if (itemDescription !== undefined) listing.description = itemDescription.trim();
    if (category !== undefined) listing.category = normalizeCategory(category);
    if (condition !== undefined) listing.condition = normalizeCondition(condition);
    if (status !== undefined) listing.status = status;
    if (college !== undefined) listing.college = college.trim();

    if (price !== undefined) {
      const numericPrice = Number(price);
      if (isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ message: "Price must be a valid non-negative number" });
      }
      listing.price = numericPrice;
    }

    const updatedListing = await listing.save();
    await updatedListing.populate("seller", "name email college");

    return res.status(200).json({
      message: "Listing updated successfully",
      listing: updatedListing,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing ID format" });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Ownership check: only seller can delete their listing
    if (!req.user || listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this listing" });
    }

    await Listing.findByIdAndDelete(id);
    return res.status(200).json({ message: "Listing deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Alias for backwards compatibility
export const deletListing = deleteListing;

export const markAsSold = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing ID format" });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Ownership check: only seller can mark listing as sold
    if (!req.user || listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to modify this listing" });
    }

    listing.status = "Sold";
    await listing.save();
    await listing.populate("seller", "name email college");

    return res.status(200).json({
      message: "Listing marked as sold",
      listing,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Alias for backwards compatibility
export const markasSold = markAsSold;