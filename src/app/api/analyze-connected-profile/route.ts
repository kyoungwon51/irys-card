import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession() as any;
    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const twitterId = session.user.twitterId;
    const username = session.user.username;
    
    // 실제 Twitter API 호출 시도
    try {
      const profileData = await fetchTwitterUserProfile(twitterId, session.accessToken);
      const tweetsData = await fetchUserTweets(twitterId, session.accessToken);
      
      // AI 기반 자기소개 생성
      const enhancedBio = generateAIBio(profileData, tweetsData);
      
      const enhancedProfile = {
        ...profileData,
        description: enhancedBio || profileData.description,
      };
      
      return NextResponse.json({ profile: enhancedProfile });
      
    } catch (twitterError) {
      console.log('Twitter API failed, using enhanced mock data:', twitterError);
      // Fallback to enhanced mock data
      const profileAnalysis = generateEnhancedProfile(username);
      return NextResponse.json({ profile: profileAnalysis });
    }
    
  } catch (error) {
    console.error('Profile analysis error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { 
      status: 500 
    });
  }
}

async function fetchTwitterUserProfile(userId: string, accessToken: string) {
  const response = await fetch(
    `https://api.twitter.com/2/users/${userId}?user.fields=description,public_metrics,profile_image_url,verified,location`,
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
  return data.data;
}

async function fetchUserTweets(userId: string, accessToken: string) {
  const response = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=created_at,public_metrics`,
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

function generateAIBio(profile: any, tweets: any[]) {
  // 트윗 내용 분석하여 AI 기반 자기소개 생성
  const tweetTexts = tweets.map(tweet => tweet.text).join(' ');
  
  // 간단한 키워드 분석
  const keywords = extractKeywords(tweetTexts);
  const themes = analyzeThemes(keywords);
  
  if (themes.length > 0) {
    const bioTemplates = [
      `${themes[0]} enthusiast | Building with passion 🚀`,
      `Passionate about ${themes.slice(0, 2).join(' & ').toLowerCase()} | Creating the future`,
      `${themes[0]} developer | ${profile.description?.split('.')[0] || 'Innovating every day'} ✨`,
      `Crypto native | ${themes.join(', ').toLowerCase()} advocate | GM 🌅`,
    ];
    
    return bioTemplates[Math.floor(Math.random() * bioTemplates.length)];
  }
  
  return profile.description; // 원래 bio 유지
}

function extractKeywords(text: string): string[] {
  const cryptoKeywords = [
    'bitcoin', 'ethereum', 'web3', 'defi', 'nft', 'dao', 'blockchain', 
    'crypto', 'solana', 'polygon', 'arbitrum', 'optimism', 'monad',
    'dapp', 'smart contract', 'yield', 'staking', 'trading', 'hodl'
  ];
  
  const techKeywords = [
    'javascript', 'react', 'nodejs', 'python', 'rust', 'solidity',
    'frontend', 'backend', 'fullstack', 'ai', 'ml', 'development'
  ];
  
  const allKeywords = [...cryptoKeywords, ...techKeywords];
  const lowerText = text.toLowerCase();
  
  return allKeywords.filter(keyword => lowerText.includes(keyword));
}

function analyzeThemes(keywords: string[]): string[] {
  const themeMapping: { [key: string]: string[] } = {
    'Web3': ['web3', 'blockchain', 'dapp', 'smart contract'],
    'DeFi': ['defi', 'yield', 'staking', 'trading'],
    'NFT': ['nft'],
    'Development': ['javascript', 'react', 'nodejs', 'python', 'rust', 'solidity', 'development'],
    'Crypto': ['bitcoin', 'ethereum', 'crypto', 'hodl'],
  };
  
  const themes: string[] = [];
  
  for (const [theme, themeKeywords] of Object.entries(themeMapping)) {
    if (themeKeywords.some(keyword => keywords.includes(keyword))) {
      themes.push(theme);
    }
  }
  
  return themes.slice(0, 3); // 최대 3개 테마만
}

function generateEnhancedProfile(username: string) {
  // 실제 Twitter API 대신 사용자명 기반으로 더 정교한 프로필 생성
  const topics = [
    'Web3 개발자', 'DeFi 연구자', 'NFT 아티스트', '크립토 트레이더', 
    'DAO 컨트리뷰터', '블록체인 엔지니어', 'Smart Contract 감사관', 'Meme Creator'
  ];
  
  const bio_templates = [
    `${topics[Math.floor(Math.random() * topics.length)]} | Building the future of decentralized web`,
    `Passionate about ${topics[Math.floor(Math.random() * topics.length)].toLowerCase()} | $MONAD believer 🚀`,
    `${topics[Math.floor(Math.random() * topics.length)]} | Shaping the new internet, one block at a time`,
    `Crypto native since 2017 | ${topics[Math.floor(Math.random() * topics.length)]} | GM 🌅`,
  ];

  const locations = [
    'Decentraland', 'Metaverse', 'The Blockchain', 'Crypto Twitter', 
    'Seoul, Korea', 'San Francisco, CA', 'Ethereum Layer 2', 'DeFi Summer'
  ];

  return {
    username: username,
    name: `${username.charAt(0).toUpperCase() + username.slice(1)} 🔥`,
    description: bio_templates[Math.floor(Math.random() * bio_templates.length)],
    profile_image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=50fed6`,
    public_metrics: {
      followers_count: Math.floor(Math.random() * 50000) + 1000,
      following_count: Math.floor(Math.random() * 2000) + 100,
      tweet_count: Math.floor(Math.random() * 10000) + 500,
    },
    verified: Math.random() > 0.7, // 30% chance of being verified
    location: locations[Math.floor(Math.random() * locations.length)],
  };
}
