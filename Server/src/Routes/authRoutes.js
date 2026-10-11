import { registerUser, loginUser, logoutUser, getMe } from "../Controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import express from "express";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/login", (req, res) => {
  res.status(405).json({ message: "Login requires a POST request with credentials in the body" });
});

router.post("/logout", logoutUser);
router.get("/logout", logoutUser);

router.get("/me", protect, getMe);

export default router;