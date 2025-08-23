import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'

interface TwitterProfile {
  id: string;
  username: string;
  name: string;
  description: string;
  profile_image_url: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  verified: boolean;
  location?: string;
}

interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
}

interface TweetAnalysis {
  personality: string[];
  interests: string[];
  expertise: string[];
  tone: string;
  activity: string;
  language: string;
}

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // 세션에서 액세스 토큰 가져오기 (앱 전용 토큰 사용 가능)
    const session = await getServerSession(authConfig) as { accessToken?: string } | null;
    let accessToken = session?.accessToken;

    // 세션에 액세스 토큰이 없으면 앱 전용 Bearer Token 사용
    if (!accessToken) {
      accessToken = process.env.TWITTER_BEARER_TOKEN;
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Twitter API access not available' }, { status: 401 })
    }

    console.log('Fetching profile for username:', username);

    try {
      // 1. 사용자 프로필 정보 가져오기
      const profileData = await fetchTwitterUserProfileByUsername(username, accessToken);
      console.log('Profile data received:', profileData);
      
      // 2. 사용자의 트윗 가져오기
      const tweetsData = await fetchUserTweetsByUserId(profileData.id, accessToken);
      console.log('Tweets data received:', tweetsData?.length, 'tweets');
      
      // 3. AI 기반 자기소개 생성
      const enhancedBio = generateAIBio(profileData, tweetsData);
      console.log('Enhanced bio generated:', enhancedBio);
      
      const enhancedProfile = {
        ...profileData,
        profileImage: profileData.profile_image_url, // Twitter API 필드를 frontend 형식으로 매핑
        description: enhancedBio || profileData.description,
        tweets: tweetsData?.slice(0, 5) || [], // 최근 5개 트윗만 포함
      };
      
      return NextResponse.json({ profile: enhancedProfile });
      
    } catch (twitterError) {
      console.error('Twitter API failed:', twitterError);
      // Fallback to basic profile without tweets
      try {
        const basicProfile = await fetchTwitterUserProfileByUsername(username, accessToken);
        const enhancedBio = generatePersonalityBasedBio(basicProfile);
        
        const fallbackProfile = {
          ...basicProfile,
          profileImage: basicProfile.profile_image_url, // Twitter API 필드를 frontend 형식으로 매핑
          description: enhancedBio || basicProfile.description,
          tweets: [], // 트윗을 가져올 수 없는 경우 빈 배열
        };
        
        return NextResponse.json({ profile: fallbackProfile });
      } catch (fallbackError) {
        console.error('Even basic profile fetch failed:', fallbackError);
        return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 400 });
      }
    }
    
  } catch (error) {
    console.error('Profile analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze profile' },
      { status: 500 }
    )
  }
}

async function fetchTwitterUserProfileByUsername(username: string, accessToken: string): Promise<TwitterProfile> {
  const response = await fetch(
    `https://api.twitter.com/2/users/by/username/${username}?user.fields=name,description,public_metrics,profile_image_url,verified,location`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.data) {
    throw new Error('User not found');
  }
  return data.data;
}

async function fetchUserTweetsByUserId(userId: string, accessToken: string): Promise<TwitterTweet[]> {
  const response = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?max_results=50&tweet.fields=created_at,public_metrics,context_annotations&exclude=retweets,replies`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data || [];
}

function generateAIBio(profile: TwitterProfile, tweets: TwitterTweet[]): string {
  if (!tweets || tweets.length === 0) {
    return generatePersonalityBasedBio(profile);
  }

  const analysis = performDeepTweetAnalysis(tweets);
  return createPersonalizedBio(analysis, profile);
}

function performDeepTweetAnalysis(tweets: TwitterTweet[]): TweetAnalysis {
  // 트윗 텍스트 분석
  const allText = tweets.map(tweet => tweet.text.toLowerCase()).join(' ');
  
  // 성격 분석
  const personality = [];
  if (allText.includes('build') || allText.includes('create') || allText.includes('develop')) {
    personality.push('creative');
  }
  if (allText.includes('data') || allText.includes('analysis') || allText.includes('research')) {
    personality.push('analytical');
  }
  if (allText.includes('community') || allText.includes('together') || allText.includes('team')) {
    personality.push('community');
  }

  // 관심사 분석
  const interests = [];
  if (allText.includes('crypto') || allText.includes('web3') || allText.includes('blockchain')) {
    interests.push('Crypto & Web3');
  }
  if (allText.includes('code') || allText.includes('dev') || allText.includes('programming')) {
    interests.push('Development');
  }
  if (allText.includes('ai') || allText.includes('tech') || allText.includes('innovation')) {
    interests.push('AI & Tech');
  }

  // 전문성 분석
  const expertise = [];
  if (allText.includes('technical') || allText.includes('engineering')) {
    expertise.push('tech');
  }
  if (allText.includes('business') || allText.includes('strategy')) {
    expertise.push('business');
  }

  // 톤 분석
  const tone = allText.includes('!') || allText.includes('awesome') || allText.includes('amazing') ? 'positive' : 'casual';

  // 활동도 분석
  const activity = tweets.length > 20 ? 'very_active' : 'moderate';

  return {
    personality,
    interests,
    expertise,
    tone,
    activity,
    language: 'english'
  };
}

function createPersonalizedBio(analysis: TweetAnalysis, _profile: TwitterProfile): string {
  const { personality, interests, expertise, tone, activity } = analysis;
  
  // Personality-based prefix
  let prefix = '';
  if (personality.includes('creative')) {
    prefix = tone === 'casual' ? 'Creative builder' : 'Innovation-driven';
  } else if (personality.includes('analytical')) {
    prefix = 'Data-driven';
  } else if (personality.includes('community')) {
    prefix = 'Community-focused';
  } else {
    prefix = activity === 'very_active' ? 'Passionate' : 'Thoughtful';
  }
  
  // Main focus/expertise
  let mainFocus = '';
  if (interests.includes('Crypto & Web3')) {
    mainFocus = expertise.includes('tech') ? 'Web3 developer' : 'Crypto enthusiast';
  } else if (interests.includes('Development')) {
    mainFocus = 'developer';
  } else if (interests.includes('AI & Tech')) {
    mainFocus = 'tech innovator';
  } else if (expertise.includes('business')) {
    mainFocus = 'business strategist';
  } else {
    mainFocus = interests[0] ? `${interests[0]} specialist` : 'digital creator';
  }
  
  // Secondary description
  let secondary = '';
  if (interests.length >= 2) {
    secondary = `exploring ${interests.slice(0, 2).join(' & ')}`;
  } else if (personality.includes('learning')) {
    secondary = 'pursuing continuous learning and growth';
  } else if (expertise.includes('mentor')) {
    secondary = 'passionate about knowledge sharing';
  } else {
    secondary = 'exploring new opportunities';
  }
  
  // Ending phrase
  let ending = '';
  if (tone === 'casual') {
    ending = activity === 'very_active' ? '🚀' : '✨';
  } else if (tone === 'positive') {
    ending = '🌟';
  } else {
    ending = activity === 'very_active' ? '💫' : '🔮';
  }
  
  return `${prefix} ${mainFocus} | ${secondary} ${ending}`;
}

function generatePersonalityBasedBio(_profile: TwitterProfile): string {
  // Generate bio using profile info only when no tweets available
  const bioTemplates = [
    'Creator pursuing new technology and innovation 🚀',
    'Digital explorer discovering endless possibilities ✨',
    'Builder crafting the future with code and creativity 💫',
    'Visionary believing in the infinite potential of Web3 🌟',
    'Collaborator growing together with the community 🤝'
  ];
  
  return bioTemplates[Math.floor(Math.random() * bioTemplates.length)];
}
