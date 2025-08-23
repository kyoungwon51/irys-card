import { NextRequest, NextResponse } from 'next/server'

// 무료로 사용 가능한 스타일 변환 옵션들
const STYLE_CONVERSION_OPTIONS = {
  // 무료 AI 모델들 (Hugging Face)
  anime: {
    name: 'Anime Style',
    huggingFaceModel: 'Linaqruf/anything-v3.0',
    prompt: 'anime style portrait, high quality, detailed, colorful',
    fallback: 'adventurer'
  },
  cartoon: {
    name: 'Cartoon Style', 
    huggingFaceModel: 'nitrosocke/Cartoon-Diffusion',
    prompt: 'cartoon style portrait, pixar style, high quality',
    fallback: 'big-smile'
  },
  pixel: {
    name: 'Pixel Art',
    huggingFaceModel: 'nerijs/pixel-art-xl',
    prompt: 'pixel art style portrait, 8bit, retro gaming',
    fallback: 'pixel-art'
  },
  oil_painting: {
    name: 'Oil Painting',
    huggingFaceModel: 'runwayml/stable-diffusion-v1-5',
    prompt: 'oil painting portrait, classical art style, detailed',
    fallback: 'avataaars'
  },
  cyberpunk: {
    name: 'Cyberpunk',
    huggingFaceModel: 'DGSpitzer/Cyberpunk-Anime-Diffusion',
    prompt: 'cyberpunk anime style, neon, futuristic',
    fallback: 'bottts'
  }
};

interface ConvertRequest {
  imageUrl: string;
  style?: keyof typeof STYLE_CONVERSION_OPTIONS;
  username?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, style = 'anime', username = 'user' }: ConvertRequest = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    console.log(`Converting image to ${style} style:`, imageUrl);

    // 방법 1: 고급 AI 변환 시도 (API 키가 있는 경우)
    if (process.env.HUGGING_FACE_API_KEY) {
      try {
        const aiResult = await convertWithAI(imageUrl, style);
        if (aiResult) return aiResult;
      } catch (error) {
        console.log('AI conversion failed, trying alternative methods:', error);
      }
    }

    // 방법 2: Replicate 시도 (무료 티어)
    if (process.env.REPLICATE_API_TOKEN) {
      try {
        const replicateResult = await convertWithReplicate(imageUrl, style);
        if (replicateResult) return replicateResult;
      } catch (error) {
        console.log('Replicate conversion failed:', error);
      }
    }

    // 방법 3: 무료 스타일화된 아바타 생성 (항상 작동)
    return generateStylizedAvatar(username, style);

  } catch (error) {
    console.error('Style conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert image style' },
      { status: 500 }
    );
  }
}

// Hugging Face AI 모델을 사용한 변환
async function convertWithAI(imageUrl: string, style: keyof typeof STYLE_CONVERSION_OPTIONS) {
  const config = STYLE_CONVERSION_OPTIONS[style];
  
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${config.huggingFaceModel}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: config.prompt,
        parameters: {
          image: imageUrl,
          num_inference_steps: 20,
          guidance_scale: 7.5,
        }
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.status}`);
  }

  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  
  return NextResponse.json({
    convertedImageUrl: `data:image/png;base64,${base64}`,
    style: config.name,
    provider: 'Hugging Face AI',
    originalUrl: imageUrl
  });
}

// Replicate를 사용한 변환  
async function convertWithReplicate(imageUrl: string, style: keyof typeof STYLE_CONVERSION_OPTIONS) {
  // Replicate 동적 import
  const { default: Replicate } = await import('replicate');
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  const config = STYLE_CONVERSION_OPTIONS[style];
  
  // 스타일별로 다른 모델 사용
  let modelId: `${string}/${string}:${string}`;
  let input: Record<string, unknown>;
  
  switch(style) {
    case 'anime':
      modelId = "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4";
      input = {
        image: imageUrl,
        prompt: config.prompt,
        num_steps: 20,
        style_strength_ratio: 20
      };
      break;
    case 'cartoon':
      modelId = "fofr/become-image:2b24003205cf8e23cf0bd64d1be1213066ab3d9bf28f1ab8f14cef3db8a40aa6";
      input = {
        image: imageUrl,
        prompt: config.prompt
      };
      break;
    default:
      throw new Error(`Replicate model not configured for ${style}`);
  }

  const output = await replicate.run(modelId, { input });
  
  return NextResponse.json({
    convertedImageUrl: Array.isArray(output) ? output[0] : output,
    style: config.name,
    provider: 'Replicate',
    originalUrl: imageUrl
  });
}

// 무료 스타일화된 아바타 생성 (항상 작동하는 폴백)
function generateStylizedAvatar(username: string, style: keyof typeof STYLE_CONVERSION_OPTIONS) {
  const config = STYLE_CONVERSION_OPTIONS[style];
  const seed = username + style; // 스타일별로 다른 시드
  
  // 스타일별 색상 테마
  const colorSchemes = {
    anime: ['ffb3d9', 'd9b3ff', 'b3d9ff', 'ffb3b3', 'b3ffb3'],
    cartoon: ['ffcc99', '99ccff', 'cc99ff', 'ffff99', '99ffcc'],
    pixel: ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'ffd93d'],
    oil_painting: ['d4a574', '8b7355', 'a0522d', 'cd853f', 'daa520'],
    cyberpunk: ['00ffff', 'ff00ff', '00ff00', 'ffff00', 'ff6600']
  };
  
  const colors = colorSchemes[style] || colorSchemes.anime;
  const backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  
  // DiceBear 스타일 매핑
  const diceBearStyle = config.fallback;
  
  const styledAvatar = `https://api.dicebear.com/7.x/${diceBearStyle}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${backgroundColor}&radius=25`;
  
  return NextResponse.json({
    convertedImageUrl: styledAvatar,
    style: config.name,
    provider: 'DiceBear Stylized',
    originalUrl: '',
    cssEffect: getStyleCSSEffect(style),
    note: 'Generated stylized avatar with thematic colors'
  });
}

// 스타일별 CSS 효과
function getStyleCSSEffect(style: keyof typeof STYLE_CONVERSION_OPTIONS) {
  const effects = {
    anime: 'saturate(1.4) contrast(1.1) brightness(1.05) hue-rotate(10deg)',
    cartoon: 'saturate(1.6) contrast(1.3) brightness(1.1) hue-rotate(-5deg)',
    pixel: 'contrast(1.4) saturate(1.5) pixelated',
    oil_painting: 'blur(0.3px) saturate(1.1) contrast(1.2) sepia(0.1)',
    cyberpunk: 'saturate(1.8) contrast(1.4) brightness(0.9) hue-rotate(270deg)'
  };
  
  return effects[style] || 'none';
}
