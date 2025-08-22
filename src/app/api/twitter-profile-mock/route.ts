import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // 실제 Twitter API 대신 목 데이터 반환 (OAuth 문제 해결될 때까지)
    const mockProfile = {
      id: Math.random().toString(36).substr(2, 9),
      username: username,
      name: `${username.charAt(0).toUpperCase() + username.slice(1)} User`,
      description: `크리에이터이자 개발자입니다. Web3와 AI에 관심이 많습니다. 🚀 #BuildInPublic`,
      profile_image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      public_metrics: {
        followers_count: Math.floor(Math.random() * 10000) + 100,
        following_count: Math.floor(Math.random() * 1000) + 50,
        tweet_count: Math.floor(Math.random() * 5000) + 500,
      },
      verified: Math.random() > 0.8,
      location: ['Seoul, Korea', 'San Francisco, CA', 'Tokyo, Japan', 'London, UK'][Math.floor(Math.random() * 4)],
    };

    return NextResponse.json({ 
      profile: mockProfile,
      message: 'Profile generated with mock data (OAuth configuration pending)'
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { 
      status: 500 
    });
  }
}
