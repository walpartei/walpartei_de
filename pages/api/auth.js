import jwt from "jsonwebtoken";
import cookie from "cookie";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { govId } = req.body;
  if (!govId) return res.status(400).json({ error: "Missing ID" });

  // Hashing the user gov ID (Use a real hashing function in production)
  const hashedId = `hash_${govId}`;

  // Generate JWT token
  const token = jwt.sign({ govId: hashedId }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Set cookie
  res.setHeader("Set-Cookie", cookie.serialize("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 3600,
  }));

  res.status(200).json({ success: true, message: "Authenticated" });
}
