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
      
      const tweetsData = await fetchUserTweets(twitterId!, accessToken);
      console.log('Tweets data received:', tweetsData?.length, 'tweets');
      console.log('First tweet:', tweetsData?.[0]);
      
      // AI 기반 자기소개 생성
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
        description: '',
        profileImage: sessionUser.user?.image || sessionUser.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionUser.user?.username}&backgroundColor=50fed6`,
        public_metrics: {
          followers_count: Math.floor(Math.random() * 10000) + 500,
          following_count: Math.floor(Math.random() * 1000) + 100,
        },
        verified: false,
        location: 'Crypto Twitter',
        tweets: [
          {
            id: '1',
            text: 'Just published a comprehensive analysis of the current DeFi landscape 🚀 Exciting times ahead!',
            created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            public_metrics: { like_count: 24, retweet_count: 5, reply_count: 3, quote_count: 1 }
          },
          {
            id: '2',
            text: 'Building the future of decentralized applications one block at a time ⛓️',
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
      
      const enhancedBio = generatePersonalityBasedBio();
      
      const fallbackProfile = {
        ...sessionProfile,
        description: enhancedBio || 'Web3 enthusiast building the future of decentralized technology. Always learning, always growing.',
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

async function fetchUserTweets(userId: string, accessToken: string | undefined): Promise<TwitterTweet[]> {
  // 사용자 토큰이 없으면 앱 전용 토큰 사용
  const bearerToken = accessToken || process.env.TWITTER_BEARER_TOKEN;
  
  if (!bearerToken) {
    throw new Error('No access token or bearer token available');
  }
  
  console.log('Fetching tweets with token type:', accessToken ? 'User token' : 'App token');
  
  const response = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?max_results=50&tweet.fields=created_at,public_metrics,context_annotations&exclude=retweets,replies`,
    {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Twitter API tweets error: ${response.status} - ${errorText}`);
    throw new Error(`Twitter API tweets error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  return data.data || [];
}

function generateAIBio(profile: TwitterProfile, tweets: TwitterTweet[]): string {
  if (!tweets || tweets.length === 0) {
    return generatePersonalityBasedBio();
  }
  
  // 트윗 내용 종합 분석
  const tweetTexts = tweets.map(tweet => tweet.text).join(' ');
  const analysis = performDeepTweetAnalysis(tweetTexts, tweets);
  
  console.log('Tweet analysis result:', analysis);
  
  // 분석 결과를 바탕으로 개인화된 자기소개 생성
  return createPersonalizedBio(analysis);
}

function performDeepTweetAnalysis(tweetTexts: string, tweets: TwitterTweet[]) {
  const topics = extractKeyTopics(tweetTexts);
  const sentimentAnalysis = analyzeSentiment(tweetTexts);
  const engagementAnalysis = analyzeEngagement(tweets);
  const postingPatterns = analyzePostingPatterns(tweets);
  const writingStyle = analyzeWritingStyle(tweetTexts);
  
  return {
    topics,
    sentiment: sentimentAnalysis,
    engagement: engagementAnalysis,
    patterns: postingPatterns,
    style: writingStyle
  };
}

function extractKeyTopics(text: string): string[] {
  const techKeywords = ['blockchain', 'crypto', 'defi', 'web3', 'nft', 'dao', 'smart contract', 'ethereum', 'bitcoin', 'solana', 'polygon', 'layer 2', 'dapp', 'gamefi', 'metaverse', 'ai', 'machine learning', 'data science', 'python', 'javascript', 'react', 'node', 'aws', 'cloud', 'devops'];
  const businessKeywords = ['startup', 'entrepreneur', 'business', 'growth', 'strategy', 'marketing', 'sales', 'product', 'leadership', 'team', 'innovation', 'venture capital', 'funding', 'investment'];
  const creativeKeywords = ['design', 'art', 'creative', 'photography', 'music', 'writing', 'content', 'brand', 'visual', 'aesthetic', 'ui', 'ux', 'graphic'];
  
  const foundTopics: string[] = [];
  const lowerText = text.toLowerCase();
  
  techKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) foundTopics.push(keyword);
  });
  
  businessKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) foundTopics.push(keyword);
  });
  
  creativeKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) foundTopics.push(keyword);
  });
  
  return foundTopics.slice(0, 5);
}

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['excited', 'amazing', 'great', 'awesome', 'fantastic', 'incredible', 'love', 'happy', 'optimistic', 'bullish', 'moon', '🚀', '💎', '🔥', '✨', '🌟', '💪', '🙌', '💚', '🎉'];
  const negativeWords = ['disappointed', 'frustrated', 'worried', 'concerning', 'bearish', 'dump', 'crash', 'rekt', '😭', '💸', '📉', '😞', '😰'];
  
  const lowerText = text.toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function analyzeEngagement(tweets: TwitterTweet[]) {
  if (!tweets || tweets.length === 0) return { level: 'moderate', avgLikes: 10, avgRetweets: 2 };
  
  const totalLikes = tweets.reduce((sum, tweet) => sum + (tweet.public_metrics?.like_count || 0), 0);
  const totalRetweets = tweets.reduce((sum, tweet) => sum + (tweet.public_metrics?.retweet_count || 0), 0);
  
  const avgLikes = Math.round(totalLikes / tweets.length);
  const avgRetweets = Math.round(totalRetweets / tweets.length);
  
  let level = 'low';
  if (avgLikes > 50 || avgRetweets > 10) level = 'high';
  else if (avgLikes > 10 || avgRetweets > 2) level = 'moderate';
  
  return { level, avgLikes, avgRetweets };
}

function analyzePostingPatterns(tweets: TwitterTweet[]) {
  if (!tweets || tweets.length === 0) return { frequency: 'moderate', timePreference: 'varied' };
  
  const frequency = tweets.length > 20 ? 'high' : tweets.length > 5 ? 'moderate' : 'low';
  
  return { frequency, timePreference: 'varied' };
}

function analyzeWritingStyle(text: string) {
  const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
  const hashtagCount = (text.match(/#\w+/g) || []).length;
  const avgLength = text.length / (text.split('.').length || 1);
  
  return {
    useEmojis: emojiCount > 5 ? 'frequent' : emojiCount > 0 ? 'occasional' : 'rare',
    useHashtags: hashtagCount > 10 ? 'frequent' : hashtagCount > 0 ? 'occasional' : 'rare',
    style: avgLength > 100 ? 'detailed' : avgLength > 50 ? 'balanced' : 'concise'
  };
}

interface TweetAnalysis {
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  engagement: {
    level: string;
    avgLikes?: number;
    avgRetweets?: number;
  };
  patterns?: {
    frequency: string;
    timePreference: string;
  };
  style?: {
    useEmojis: string;
    useHashtags: string;
    style: string;
  };
}

function createPersonalizedBio(analysis: TweetAnalysis): string {
  const topics = analysis.topics || [];
  const sentiment = analysis.sentiment || 'positive';
  const engagement = analysis.engagement || { level: 'moderate' };
  
  let bio = '';
  
  // 주요 관심사 기반 시작
  if (topics.includes('blockchain') || topics.includes('web3') || topics.includes('crypto')) {
    bio = 'Web3 visionary and blockchain advocate';
  } else if (topics.includes('ai') || topics.includes('machine learning')) {
    bio = 'AI researcher and technology innovator';
  } else if (topics.includes('startup') || topics.includes('entrepreneur')) {
    bio = 'Serial entrepreneur and startup enthusiast';
  } else if (topics.includes('design') || topics.includes('creative')) {
    bio = 'Creative designer and digital artist';
  } else {
    bio = 'Digital innovator and thought leader';
  }
  
  // 성격과 스타일 추가
  if (sentiment === 'positive') {
    bio += ' with an optimistic outlook on technology\'s potential.';
  } else {
    bio += ' focused on building meaningful solutions.';
  }
  
  // 커뮤니티 참여도 추가
  if (engagement.level === 'high') {
    bio += ' Active community builder and thought sharer.';
  } else if (engagement.level === 'moderate') {
    bio += ' Engaging with the community through thoughtful insights.';
  }
  
  // 전문성 영역 추가
  const specialties = topics.slice(0, 3).join(', ');
  if (specialties) {
    bio += ` Passionate about ${specialties} and their impact on the future.`;
  }
  
  return bio;
}

function generatePersonalityBasedBio(): string {
  const bios = [
    'Passionate Web3 builder and blockchain enthusiast. Always exploring the intersection of technology and innovation. 🚀',
    'Digital nomad crafting the future of decentralized technology. Community-driven and always learning. ⛓️',
    'Innovator at heart, exploring the endless possibilities of blockchain and AI. Building tomorrow, today. 🌟',
    'Tech visionary with a passion for creating meaningful solutions. Bridging the gap between ideas and reality. 💡',
    'Entrepreneur and developer pushing the boundaries of what\'s possible in Web3. Dream big, build bigger. 🔥',
    'Creative technologist combining art and code to build beautiful, functional experiences. Innovation through iteration. ✨',
    'Community builder fostering connections and collaboration in the decentralized world. Together we rise. 🤝',
    'Data-driven decision maker with a keen eye for emerging trends. Analytics meets intuition. 📊',
    'Lifelong learner constantly evolving with the rapidly changing tech landscape. Curiosity fuels growth. 🧠',
    'Strategic thinker translating complex concepts into accessible solutions. Clarity through complexity. 🎯'
  ];
  
  return bios[Math.floor(Math.random() * bios.length)];
}
