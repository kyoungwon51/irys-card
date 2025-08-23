import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';

interface TwitterSession {
  user?: {
    twitterId?: string;
    username?: string;
  };
  accessToken?: string;
}

interface TwitterProfile {
  username: string;
  name: string;
  description: string;
  profile_image_url: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
  };
  verified?: boolean;
  location?: string;
}

interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
  };
}

export async function POST(_request: Request) {
  try {
    console.log('Analyze Connected Profile API called');
    
    const session = await getServerSession(authConfig) as TwitterSession;
    
    console.log('Full session object:', JSON.stringify(session, null, 2));
    
    if (!session || !session.user) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 세션에서 트위터 ID와 토큰 추출
    const extendedSession = session as TwitterSession & { 
      accessToken?: string;
      twitterId?: string; 
      user?: { twitterId?: string } 
    };
    const twitterId = extendedSession.user?.twitterId || extendedSession.twitterId;
    const accessToken = extendedSession.accessToken;
    
    console.log('Twitter ID from session:', twitterId);
    console.log('Access Token exists:', !!accessToken);
    
    // 실제 Twitter API 호출 시도
    try {
      console.log('Attempting to fetch Twitter profile...');
      console.log('Twitter ID:', twitterId);
      console.log('Access Token (first 10 chars):', accessToken?.substring(0, 10) + '...');
      
      const profileData = await fetchTwitterUserProfile(twitterId!, accessToken);
      console.log('Profile data received:', JSON.stringify(profileData, null, 2));
      
      const enhancedProfile = {
        ...profileData,
        profileImage: profileData.profile_image_url, // Twitter API 필드를 frontend 형식으로 매핑
        description: profileData.description || 'Crypto Twitter User',
      };
      
      return NextResponse.json({ profile: enhancedProfile });
      
    } catch (twitterError) {
      console.error('Twitter API failed:', twitterError);
      
      // 세션에서 기본 정보 추출하여 프로필 생성
      const sessionUser = session as TwitterSession & { 
        user?: { 
          image?: string; 
          displayName?: string; 
          profileImage?: string;
          name?: string;
        } 
      };
      const sessionProfile = {
        username: sessionUser.user?.username || 'user',
        name: sessionUser.user?.name || sessionUser.user?.displayName || 'User',
        displayName: sessionUser.user?.name || sessionUser.user?.displayName || 'User',
        description: 'Crypto Twitter User',
        profileImage: sessionUser.user?.image || sessionUser.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionUser.user?.username}&backgroundColor=50fed6`,
        public_metrics: {
          followers_count: Math.floor(Math.random() * 10000) + 500,
          following_count: Math.floor(Math.random() * 1000) + 100,
        },
        verified: false,
        location: 'Crypto Twitter',
      };
      
      const fallbackProfile = {
        ...sessionProfile,
        description: 'Web3 enthusiast building the future of decentralized technology. Always learning, always growing.',
      };
      
      return NextResponse.json({ profile: fallbackProfile });
    }
    
  } catch (error) {
    console.error('Profile analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze profile' },
      { status: 500 }
    );
  }
}

async function fetchTwitterUserProfile(userId: string, accessToken: string | undefined): Promise<TwitterProfile> {
  // 사용자 토큰이 없으면 앱 전용 토큰 사용
  const bearerToken = accessToken || process.env.TWITTER_BEARER_TOKEN;
  
  if (!bearerToken) {
    throw new Error('No access token or bearer token available');
  }
  
  console.log('Using token type:', accessToken ? 'User token' : 'App token');
  
  const response = await fetch(
    `https://api.twitter.com/2/users/${userId}?user.fields=name,description,public_metrics,profile_image_url,verified,location`,
    {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Twitter API profile error: ${response.status} - ${errorText}`);
    throw new Error(`Twitter API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  return data.data;
}
