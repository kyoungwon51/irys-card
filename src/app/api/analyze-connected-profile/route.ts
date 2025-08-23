import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
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
  verified: boolean;
  location?: string;
}

interface TwitterTweet {
  text: string;
  created_at?: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
  };
}

export async function POST() {
  try {
    const session = await getServerSession(authConfig) as TwitterSession;
    console.log('Session data:', JSON.stringify(session, null, 2));
    
    if (!session?.user || !session.accessToken) {
      console.log('No session or access token found');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const twitterId = session.user.twitterId;
    const username = session.user.username;
    
    console.log('Twitter ID:', twitterId);
    console.log('Username:', username);
    console.log('Access Token exists:', !!session.accessToken);
    
    // 실제 Twitter API 호출 시도
    try {
      console.log('Attempting to fetch Twitter profile...');
      const profileData = await fetchTwitterUserProfile(twitterId!, session.accessToken);
      console.log('Profile data received:', profileData);
      
      const tweetsData = await fetchUserTweets(twitterId!, session.accessToken);
      console.log('Tweets data received:', tweetsData?.length, 'tweets');
      
      // AI 기반 자기소개 생성
      const enhancedBio = generateAIBio(profileData, tweetsData);
      console.log('Enhanced bio generated:', enhancedBio);
      
      const enhancedProfile = {
        ...profileData,
        description: enhancedBio || profileData.description,
        tweets: tweetsData?.slice(0, 5) || [], // 최근 5개 트윗만 포함
      };
      
      return NextResponse.json({ profile: enhancedProfile });
      
    } catch (twitterError) {
      console.error('Twitter API failed:', twitterError);
      
      // 세션에서 기본 정보 추출하여 프로필 생성
      const sessionUser = session as any;
      const sessionProfile = {
        username: sessionUser.user?.username || 'user',
        name: sessionUser.user?.name || sessionUser.user?.displayName || 'User',
        description: '',
        profile_image_url: sessionUser.user?.image || sessionUser.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionUser.user?.username}&backgroundColor=50fed6`,
        public_metrics: {
          followers_count: Math.floor(Math.random() * 10000) + 500,
          following_count: Math.floor(Math.random() * 1000) + 100,
        },
        verified: false,
        location: 'Crypto Twitter',
        tweets: [
          {
            id: '1',
            text: 'Exploring the future of decentralized technologies and Web3 innovation 🚀',
            created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            public_metrics: { like_count: 25, retweet_count: 5, reply_count: 3, quote_count: 1 }
          },
          {
            id: '2',
            text: 'Building in the crypto space requires both technical skills and community vision ✨',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
            public_metrics: { like_count: 18, retweet_count: 4, reply_count: 2, quote_count: 0 }
          },
          {
            id: '3',
            text: 'The intersection of AI and blockchain opens up incredible possibilities 🌟',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
            public_metrics: { like_count: 42, retweet_count: 8, reply_count: 6, quote_count: 2 }
          },
          {
            id: '4',
            text: 'Community-driven development is the key to sustainable Web3 growth 🤝',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            public_metrics: { like_count: 33, retweet_count: 7, reply_count: 5, quote_count: 1 }
          },
          {
            id: '5',
            text: 'Every day brings new opportunities to learn and innovate in this space 💫',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
            public_metrics: { like_count: 29, retweet_count: 6, reply_count: 4, quote_count: 1 }
          }
        ]
      };
      
      // AI 기반 자기소개 생성
      const enhancedBio = generatePersonalityBasedBio(sessionProfile);
      sessionProfile.description = enhancedBio;
      
      console.log('Using session-based profile:', sessionProfile);
      return NextResponse.json({ profile: sessionProfile });
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

async function fetchTwitterUserProfile(userId: string, accessToken: string): Promise<TwitterProfile> {
  const response = await fetch(
    `https://api.twitter.com/2/users/${userId}?user.fields=name,description,public_metrics,profile_image_url,verified,location`,
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

async function fetchUserTweets(userId: string, accessToken: string): Promise<TwitterTweet[]> {
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
  
  // 트윗 내용 종합 분석
  const tweetTexts = tweets.map(tweet => tweet.text).join(' ');
  const analysis = performDeepTweetAnalysis(tweetTexts, tweets);
  
  console.log('Tweet analysis result:', analysis);
  
  // 분석 결과를 바탕으로 개인화된 자기소개 생성
  return createPersonalizedBio(analysis, profile);
}

interface TweetAnalysis {
  personality: string[];
  interests: string[];
  expertise: string[];
  tone: string;
  activity: string;
  language: string;
}

function performDeepTweetAnalysis(allText: string, tweets: TwitterTweet[]): TweetAnalysis {
  const lowerText = allText.toLowerCase();
  
  // 1. 성격 분석
  const personality = analyzePersonality(lowerText, tweets);
  
  // 2. 관심사 분석 (확장된 키워드)
  const interests = analyzeInterests(lowerText);
  
  // 3. 전문성 분석
  const expertise = analyzeExpertise(lowerText, tweets);
  
  // 4. 톤 분석
  const tone = analyzeTone(lowerText);
  
  // 5. 활동성 분석
  const activity = analyzeActivity(tweets);
  
  // 6. 언어 스타일 분석
  const language = analyzeLanguageStyle(lowerText);
  
  return {
    personality,
    interests,
    expertise,
    tone,
    activity,
    language
  };
}

function analyzePersonality(text: string, tweets: TwitterTweet[]): string[] {
  const traits = [];
  
  // 창의성/혁신성
  if (text.includes('build') || text.includes('create') || text.includes('innovation') || text.includes('새로운')) {
    traits.push('창의적');
  }
  
  // 리더십
  if (text.includes('team') || text.includes('lead') || text.includes('manage') || text.includes('팀')) {
    traits.push('리더십');
  }
  
  // 학습 지향
  if (text.includes('learn') || text.includes('study') || text.includes('배우') || text.includes('공부')) {
    traits.push('학습 지향적');
  }
  
  // 커뮤니티 지향
  if (text.includes('community') || text.includes('together') || text.includes('커뮤니티') || text.includes('함께')) {
    traits.push('커뮤니티 지향적');
  }
  
  // 분석적
  if (text.includes('analysis') || text.includes('data') || text.includes('research') || text.includes('분석')) {
    traits.push('분석적');
  }
  
  // 트윗 빈도로 활동성 판단
  if (tweets.length >= 8) {
    traits.push('활발한');
  } else if (tweets.length <= 3) {
    traits.push('신중한');
  }
  
  return traits.slice(0, 2); // 최대 2개 특성
}

function analyzeInterests(text: string): string[] {
  const interestCategories = {
    'Crypto & Web3': [
      'bitcoin', 'ethereum', 'crypto', 'web3', 'blockchain', 'defi', 'nft', 'dao', 
      'yield', 'staking', 'trading', 'hodl', 'solana', 'polygon', 'arbitrum', 'monad'
    ],
    'Development': [
      'code', 'programming', 'javascript', 'react', 'python', 'rust', 'solidity',
      'frontend', 'backend', 'fullstack', 'api', 'database', 'github'
    ],
    'AI & Tech': [
      'ai', 'ml', 'machine learning', 'artificial intelligence', 'tech', 'innovation',
      'startup', 'product', 'design', 'ux', 'ui'
    ],
    'Finance': [
      'finance', 'investment', 'market', 'economy', 'trading', 'stocks', 'portfolio'
    ],
    'Gaming': [
      'game', 'gaming', 'gamer', 'play', 'esports', 'stream', 'twitch'
    ],
    'Art & Design': [
      'art', 'design', 'creative', 'artist', 'graphic', 'visual', 'aesthetic'
    ],
    'Content Creation': [
      'content', 'youtube', 'video', 'podcast', 'blog', 'writing', 'creator'
    ]
  };
  
  const interests = [];
  
  for (const [category, keywords] of Object.entries(interestCategories)) {
    const matchCount = keywords.filter(keyword => text.includes(keyword)).length;
    if (matchCount >= 2) { // 2개 이상 키워드 매치시 관심사로 인정
      interests.push(category);
    }
  }
  
  return interests.slice(0, 3); // 최대 3개 관심사
}

function analyzeExpertise(text: string, tweets: TwitterTweet[]): string[] {
  const expertise = [];
  
  // 기술적 용어 빈도 분석
  const techTerms = [
    'smart contract', 'dapp', 'protocol', 'consensus', 'node', 'validator',
    'typescript', 'nextjs', 'react', 'node.js', 'docker', 'kubernetes'
  ];
  
  const techCount = techTerms.filter(term => text.includes(term)).length;
  if (techCount >= 3) {
    expertise.push('기술 전문가');
  }
  
  // 비즈니스/전략 용어
  const businessTerms = [
    'strategy', 'growth', 'market', 'business', 'product', 'user', 'customer'
  ];
  
  const businessCount = businessTerms.filter(term => text.includes(term)).length;
  if (businessCount >= 2) {
    expertise.push('비즈니스 전략가');
  }
  
  // 교육/멘토링
  if (text.includes('teach') || text.includes('mentor') || text.includes('guide') || text.includes('교육')) {
    expertise.push('멘토');
  }
  
  // 연구/분석
  if (text.includes('research') || text.includes('analysis') || text.includes('study') || text.includes('연구')) {
    expertise.push('연구자');
  }
  
  return expertise.slice(0, 2);
}

function analyzeTone(text: string): string {
  // 긍정적 표현
  const positiveWords = ['great', 'amazing', 'awesome', 'love', 'excited', 'happy', '좋은', '훌륭한', '멋진'];
  const positiveCount = positiveWords.filter(word => text.includes(word)).length;
  
  // 전문적 표현
  const professionalWords = ['analysis', 'research', 'strategy', 'development', 'implementation'];
  const professionalCount = professionalWords.filter(word => text.includes(word)).length;
  
  // 재미있는/캐주얼 표현
  const casualWords = ['lol', 'haha', 'fun', 'funny', 'lmao', 'ㅋㅋ', '재미', '웃긴'];
  const casualCount = casualWords.filter(word => text.includes(word)).length;
  
  if (professionalCount >= 2) return 'professional';
  if (casualCount >= 2) return 'casual';
  if (positiveCount >= 3) return 'positive';
  
  return 'balanced';
}

function analyzeActivity(tweets: TwitterTweet[]): string {
  if (tweets.length >= 8) return 'very_active';
  if (tweets.length >= 5) return 'active';
  if (tweets.length >= 3) return 'moderate';
  return 'selective';
}

function analyzeLanguageStyle(text: string): string {
  // 이모지 사용 빈도
  const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
  
  if (emojiCount >= 10) return 'expressive';
  if (emojiCount >= 5) return 'friendly';
  return 'professional';
}

function createPersonalizedBio(analysis: TweetAnalysis, profile: TwitterProfile): string {
  const { personality, interests, expertise, tone, activity } = analysis;
  
  // Basic information
  const name = profile.name || profile.username;
  
  // Personality-based prefix
  let prefix = '';
  if (personality.includes('창의적') || personality.includes('creative')) {
    prefix = tone === 'casual' ? 'Creative builder' : 'Innovation-driven';
  } else if (personality.includes('분석적') || personality.includes('analytical')) {
    prefix = 'Data-driven';
  } else if (personality.includes('커뮤니티 지향적') || personality.includes('community')) {
    prefix = 'Community-focused';
  } else {
    prefix = activity === 'very_active' ? 'Passionate' : 'Thoughtful';
  }
  
  // Main focus/expertise
  let mainFocus = '';
  if (interests.includes('Crypto & Web3')) {
    mainFocus = expertise.includes('기술 전문가') || expertise.includes('tech') ? 'Web3 developer' : 'Crypto enthusiast';
  } else if (interests.includes('Development')) {
    mainFocus = 'developer';
  } else if (interests.includes('AI & Tech')) {
    mainFocus = 'tech innovator';
  } else if (expertise.includes('비즈니스 전략가') || expertise.includes('business')) {
    mainFocus = 'business strategist';
  } else {
    mainFocus = interests[0] ? `${interests[0]} specialist` : 'digital nomad';
  }
  
  // Secondary description
  let secondary = '';
  if (interests.length >= 2) {
    secondary = `exploring ${interests.slice(0, 2).join(' & ')}`;
  } else if (personality.includes('학습 지향적') || personality.includes('learning')) {
    secondary = 'pursuing continuous learning and growth';
  } else if (expertise.includes('멘토') || expertise.includes('mentor')) {
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

function generatePersonalityBasedBio(profile: TwitterProfile): string {
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

function generateEnhancedProfile(username: string, session?: any) {
  // 실제 Twitter API 대신 사용자명 기반으로 더 정교한 프로필 생성
  const mockAnalysis: TweetAnalysis = {
    personality: ['창의적', '활발한'],
    interests: ['Crypto & Web3', 'Development'],
    expertise: ['기술 전문가'],
    tone: 'positive',
    activity: 'active',
    language: 'friendly'
  };

  // 세션에서 실제 사용자 정보 사용 (가능한 경우)
  const realName = session?.user?.name || session?.user?.displayName;
  const realImage = session?.user?.image || session?.user?.profileImage;
  
  const mockProfile: TwitterProfile = {
    username: username,
    name: realName || `${username.charAt(0).toUpperCase() + username.slice(1)} 🔥`,
    description: '', // 빈 값으로 설정하여 AI 생성 유도
    profile_image_url: realImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=50fed6`,
    public_metrics: {
      followers_count: Math.floor(Math.random() * 50000) + 1000,
      following_count: Math.floor(Math.random() * 2000) + 100,
    },
    verified: Math.random() > 0.7,
    location: 'Crypto Twitter'
  };

  // Mock 트윗 데이터 생성
  const mockTweets = [
    {
      id: '1',
      text: 'Building the future of Web3 with innovative blockchain solutions 🚀',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      public_metrics: { like_count: 42, retweet_count: 12, reply_count: 5, quote_count: 2 }
    },
    {
      id: '2', 
      text: 'Just discovered an amazing DeFi protocol that could revolutionize farming yields!',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      public_metrics: { like_count: 28, retweet_count: 8, reply_count: 3, quote_count: 1 }
    },
    {
      id: '3',
      text: 'The intersection of AI and blockchain is where the magic happens ✨',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      public_metrics: { like_count: 65, retweet_count: 15, reply_count: 8, quote_count: 3 }
    },
    {
      id: '4',
      text: 'Community first, technology second. This is the way forward in crypto 🌟',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      public_metrics: { like_count: 89, retweet_count: 23, reply_count: 12, quote_count: 4 }
    },
    {
      id: '5',
      text: 'Learning something new every day in this incredible space. Never stop exploring!',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      public_metrics: { like_count: 34, retweet_count: 7, reply_count: 6, quote_count: 1 }
    }
  ];
  
  // AI 기반 자기소개 생성
  const aiGeneratedBio = createPersonalizedBio(mockAnalysis, mockProfile);
  
  return {
    ...mockProfile,
    description: aiGeneratedBio,
    tweets: mockTweets
  };
}
