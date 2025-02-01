import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Implement AusweisApp2 verification
    const mockUserId = '123'; // This will be replaced with actual eID verification

    // Create JWT token
    const token = jwt.sign(
      {
        userId: mockUserId,
        isAdult: true, // Will come from AusweisApp2 verification
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set cookie
    res.setHeader(
      'Set-Cookie',
      cookie.serialize('auth', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400, // 24 hours
        path: '/',
      })
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
