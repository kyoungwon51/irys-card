import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Testing database connection...');
    
    // 테이블 생성 확인
    console.log('📊 Checking if tables exist...');
    
    // 카운터 테이블 초기화 (없으면 생성)
    const counter = await prisma.cardCounter.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', counter: 0 },
      update: {}
    });
    
    console.log('✅ Counter table ready:', counter);
    
    // 사용자 테이블 확인
    const userCount = await prisma.userCard.count();
    console.log('👥 Current user count:', userCount);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      counter: counter.counter,
      userCount,
      tables: ['user_cards', 'card_counter']
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: 'Check Vercel Functions logs for more details'
    }, { status: 500 });
  }
}
