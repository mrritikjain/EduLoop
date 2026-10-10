import User from "../Models/User.js";
import bcrypt from "bcryptjs";

export const registerUser = async (req, res) => {
  try {
    console.log("Register request body:", req.body);
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
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered !" });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = await User.create({ name, email, password: hashedPassword, college });
    res.status(201).json({ message: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
