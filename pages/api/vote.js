import jwt from "jsonwebtoken";
import { apiLimiter } from "../../utils/rateLimit";

export default function handler(req, res) {
  apiLimiter(req, res, async () => {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    const { token } = req.cookies;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { vote, proposalId } = req.body;

      if (!vote || !proposalId) return res.status(400).json({ error: "Invalid vote data" });

      // Send ZKP to zkSync contract (SIMULATED)
      console.log(`User ${decoded.govId} voted ${vote} on proposal ${proposalId}`);

      res.status(200).json({ success: true, message: "Vote submitted securely" });
    } catch (error) {
      res.status(403).json({ error: "Invalid token" });
    }
  });
}
