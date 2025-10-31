const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


let uuidv4;
import("uuid").then((uuid) => {
  uuidv4 = uuid.v4;
});


// REGISTER NEW USER
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if email already exists
    const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate API key
    const apiKey = uuidv4();

    // Save user in DB
    await db.query(
      "INSERT INTO users (name, email, password, api_key) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, apiKey]
    );

    res.status(201).json({
      message: "User registered successfully ✅",
      apiKey,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error ❌" });
  }
};

// LOGIN USER
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (user.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user[0].id, email: user[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful ✅",
      token,
      apiKey: user[0].api_key,
      user: {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error ❌" });
  }
};
