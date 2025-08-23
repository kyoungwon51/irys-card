import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

interface TwitterApiResponse {
  data: {
    id: string
    name: string
    username: string
    description: string
    profile_image_url: string
    public_metrics: {
      followers_count: number
      following_count: number
      tweet_count: number
    }
  }
  includes: {
    tweets: Array<{
      id: string
      text: string
      created_at: string
    }>
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username } = await request.json()

    // Twitter API v2로 사용자 정보와 최근 트윗 가져오기
    const userResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=description,profile_image_url,public_metrics&expansions=pinned_tweet_id&tweet.fields=created_at,text`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    )

    if (!userResponse.ok) {
      throw new Error('Failed to fetch Twitter profile')
    }

    const userData: TwitterApiResponse = await userResponse.json()

    // 최근 트윗들 가져오기
    const tweetsResponse = await fetch(
      `https://api.twitter.com/2/users/${userData.data.id}/tweets?max_results=10&tweet.fields=created_at,text`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    )

    let recentTweets = []
    if (tweetsResponse.ok) {
      const tweetsData = await tweetsResponse.json()
      recentTweets = tweetsData.data || []
    }

    // OpenAI로 프로필 분석
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tweetTexts = recentTweets.map((tweet: any) => tweet.text).join('\n')
    const profileDescription = userData.data.description || ''

    const prompt = `
다음은 트위터 사용자의 프로필 정보와 최근 트윗들입니다:

프로필 설명: ${profileDescription}
최근 트윗들:
${tweetTexts}

이 정보를 바탕으로 다음을 분석해주세요:
1. 이 사람의 성격과 특징을 한 줄로 요약
2. 주요 관심사나 전문 분야
3. 트위터에서의 활동 스타일 (예: 유머러스, 진지함, 정보 공유형 등)

응답은 반드시 JSON 형태로 해주세요:
{
  "personality": "성격 한 줄 요약",
  "interests": "주요 관심사",
  "style": "활동 스타일",
  "cardDescription": "카드에 들어갈 간단한 소개 (50자 이내)"
}
`

    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "당신은 소셜미디어 프로필 분석 전문가입니다. 주어진 정보를 바탕으로 정확하고 간결한 분석을 제공합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    })

    const analysis = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json({
      profile: userData.data,
      analysis,
      recentTweets: recentTweets.slice(0, 5) // 최근 5개 트윗만
    })

  } catch (error) {
    console.error('Profile analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze profile' },
      { status: 500 }
    )
  }
}
