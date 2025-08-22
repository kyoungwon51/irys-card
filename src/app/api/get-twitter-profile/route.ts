import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username } = await request.json()

    // Twitter API v2로 사용자 정보 가져오기
    const userResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=description,profile_image_url,public_metrics,verified,location`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    )

    if (!userResponse.ok) {
      const errorData = await userResponse.text()
      console.error('Twitter API Error:', errorData)
      return NextResponse.json({ error: 'Failed to fetch Twitter profile' }, { status: 400 })
    }

    const userData = await userResponse.json()

    if (!userData.data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const profile = {
      username: userData.data.username,
      displayName: userData.data.name,
      profileImage: userData.data.profile_image_url?.replace('_normal', '_400x400') || userData.data.profile_image_url,
      bio: userData.data.description || '',
      followers: userData.data.public_metrics?.followers_count || 0,
      following: userData.data.public_metrics?.following_count || 0,
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
