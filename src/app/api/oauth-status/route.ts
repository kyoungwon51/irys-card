import { NextResponse } from 'next/server';

export async function GET() {
  const hasTwitterCredentials = !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET);
  
  return NextResponse.json({ 
    hasTwitterCredentials,
    message: hasTwitterCredentials ? 'Twitter OAuth is configured' : 'Twitter OAuth is not configured'
  });
}
