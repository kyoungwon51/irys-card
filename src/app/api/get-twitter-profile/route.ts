import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()
    console.log('GET TWITTER PROFILE API called with username:', username);

    if (!username) {
      console.log('No username provided');
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // 세션에서 액세스 토큰 가져오기
    const session = await getServerSession(authConfig) as { accessToken?: string } | null;
    let accessToken = session?.accessToken;
    console.log('Session access token exists:', !!accessToken);

    // 세션에 액세스 토큰이 없으면 앱 전용 Bearer Token 사용 (읽기 전용)
    if (!accessToken) {
      accessToken = process.env.TWITTER_BEARER_TOKEN;
      console.log('Using bearer token, exists:', !!accessToken);
    }

    if (!accessToken) {
      console.log('No access token available');
      return NextResponse.json({ error: 'Twitter API access not available' }, { status: 401 })
    }

    console.log('Making Twitter API request to:', `https://api.twitter.com/2/users/by/username/${username}`);
    
    // Twitter API v2로 사용자 정보 가져오기
    const userResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=name,description,profile_image_url,public_metrics,verified,location`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    console.log('Twitter API response status:', userResponse.status);

    if (!userResponse.ok) {
      const errorData = await userResponse.text()
      console.error('Twitter API Error Details:', {
        status: userResponse.status,
        statusText: userResponse.statusText,
        errorData: errorData
      });
      return NextResponse.json({ 
        error: 'Failed to fetch Twitter profile',
        details: errorData,
        status: userResponse.status
      }, { status: 400 })
    }

    const userData = await userResponse.json()

    if (!userData.data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const profile = {
      username: userData.data.username,
      name: userData.data.name,
      description: userData.data.description || '',
      profile_image_url: userData.data.profile_image_url?.replace('_normal', '_400x400') || userData.data.profile_image_url,
      public_metrics: userData.data.public_metrics || {
        followers_count: 0,
        following_count: 0
      },
      verified: userData.data.verified || false,
      location: userData.data.location || ''
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
