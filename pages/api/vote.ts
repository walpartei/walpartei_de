import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

// Basic auth middleware
const authMiddleware = (req: NextApiRequest): { userId: string } | null => {
  try {
    const token = req.cookies.auth;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const user = authMiddleware(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { proposalId, vote } = req.body;

  if (!proposalId || typeof vote !== 'boolean') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    // TODO: Implement actual vote storage
    // For now, just return success
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Vote error:', error);
    return res.status(500).json({ error: 'Failed to record vote' });
  }
}
