import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const username = session.user.username;
    
    // 실제 Twitter API가 설정되어 있지 않으므로 enhanced mock data 생성
    const profileAnalysis = generateEnhancedProfile(username);
    
    return NextResponse.json({ profile: profileAnalysis });
    
  } catch (error) {
    console.error('Profile analysis error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { 
      status: 500 
    });
  }
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
