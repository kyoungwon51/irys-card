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
      };
      
      return NextResponse.json({ profile: enhancedProfile });
      
    } catch (twitterError) {
      console.error('Twitter API failed:', twitterError);
      // Fallback to enhanced mock data
      const profileAnalysis = generateEnhancedProfile(username!);
      console.log('Using fallback mock data:', profileAnalysis);
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

async function fetchTwitterUserProfile(userId: string, accessToken: string): Promise<TwitterProfile> {
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
  
  // 기본 정보
  const name = profile.name || profile.username;
  
  // 성격 기반 접두사
  let prefix = '';
  if (personality.includes('창의적')) {
    prefix = tone === 'casual' ? '창의적인 빌더' : '혁신을 추구하는';
  } else if (personality.includes('분석적')) {
    prefix = '데이터 기반의';
  } else if (personality.includes('커뮤니티 지향적')) {
    prefix = '커뮤니티를 사랑하는';
  } else {
    prefix = activity === 'very_active' ? '열정적인' : '사려깊은';
  }
  
  // 주요 관심사/전문성
  let mainFocus = '';
  if (interests.includes('Crypto & Web3')) {
    mainFocus = expertise.includes('기술 전문가') ? 'Web3 개발자' : 'Crypto 애호가';
  } else if (interests.includes('Development')) {
    mainFocus = '개발자';
  } else if (interests.includes('AI & Tech')) {
    mainFocus = 'Tech 이노베이터';
  } else if (expertise.includes('비즈니스 전략가')) {
    mainFocus = '비즈니스 전략가';
  } else {
    mainFocus = interests[0] ? `${interests[0]} 전문가` : '디지털 노마드';
  }
  
  // 보조 설명
  let secondary = '';
  if (interests.length >= 2) {
    secondary = `${interests.slice(0, 2).join(' & ')} 분야에서 활동`;
  } else if (personality.includes('학습 지향적')) {
    secondary = '지속적인 학습과 성장을 추구';
  } else if (expertise.includes('멘토')) {
    secondary = '지식 공유와 멘토링에 열정';
  } else {
    secondary = '새로운 기회를 탐색';
  }
  
  // 마무리 문구
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
  // 트윗이 없을 때 프로필 정보만으로 생성
  const bioTemplates = [
    '새로운 기술과 혁신을 추구하는 크리에이터 🚀',
    '디지털 세상의 가능성을 탐험하는 모험가 ✨',
    '코드와 창의성으로 미래를 그려가는 빌더 💫',
    'Web3와 블록체인의 무한한 잠재력을 믿는 비전니스트 🌟',
    '커뮤니티와 함께 성장하는 콜라보레이터 🤝'
  ];
  
  return bioTemplates[Math.floor(Math.random() * bioTemplates.length)];
}

function generateEnhancedProfile(username: string) {
  // 실제 Twitter API 대신 사용자명 기반으로 더 정교한 프로필 생성
  const mockAnalysis: TweetAnalysis = {
    personality: ['창의적', '활발한'],
    interests: ['Crypto & Web3', 'Development'],
    expertise: ['기술 전문가'],
    tone: 'positive',
    activity: 'active',
    language: 'friendly'
  };
  
  const mockProfile: TwitterProfile = {
    username: username,
    name: `${username.charAt(0).toUpperCase() + username.slice(1)} 🔥`,
    description: '', // 빈 값으로 설정하여 AI 생성 유도
    profile_image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=50fed6`,
    public_metrics: {
      followers_count: Math.floor(Math.random() * 50000) + 1000,
      following_count: Math.floor(Math.random() * 2000) + 100,
    },
    verified: Math.random() > 0.7,
    location: 'Crypto Twitter'
  };
  
  // AI 기반 자기소개 생성
  const aiGeneratedBio = createPersonalizedBio(mockAnalysis, mockProfile);
  
  return {
    ...mockProfile,
    description: aiGeneratedBio
  };
}
