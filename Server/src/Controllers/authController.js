import User from "../Models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "eduloop_default_secret_key", {
    expiresIn: "7d",
  });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, college } = req.body || {};

    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!email) missingFields.push("email");
    if (!password) missingFields.push("password");
    if (!college) missingFields.push("college");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered!" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      college: college.trim(),
    });

    const token = generateToken(newUser._id);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: newUser,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = generateToken(existingUser._id);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: existingUser,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Alias for backwards compatibility
export const loginuser = loginUser;

export const logoutUser = async (req, res) => {
  try {
    if (req.session) {
      req.session.destroy();
    }
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    return res.status(200).json({ user: req.user });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};