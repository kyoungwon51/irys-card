import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Replicate의 애니메 스타일 변환 모델 사용
    const output = await replicate.run(
      "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
      {
        input: {
          image: imageUrl,
          prompt: "anime style portrait, high quality, detailed, colorful",
          negative_prompt: "blurry, low quality, distorted",
          num_steps: 20,
          style_strength_ratio: 20,
          input_id_images: [imageUrl]
        }
      }
    )

    return NextResponse.json({ animeImage: output })

  } catch (error) {
    console.error('Anime conversion error:', error)
    
    // Fallback: 단순한 애니메 스타일 아바타 생성
    const { imageUrl } = await request.json()
    const username = imageUrl.includes('seed=') ? 
      imageUrl.split('seed=')[1].split('&')[0] : 
      'default'
      
    const fallbackImage = `https://api.dicebear.com/7.x/anime/svg?seed=${username}&backgroundColor=b6e3f4,c0aede,d1d4f9&eyes=variant01,variant02,variant03&mouth=variant01,variant02,variant03`
    
    return NextResponse.json({ animeImage: fallbackImage })
  }
}
