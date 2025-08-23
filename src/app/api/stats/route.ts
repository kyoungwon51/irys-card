import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 전체 사용자 수
    const totalUsers = await prisma.userCard.count();
    
    // 현재 카운터 값
    const counter = await prisma.cardCounter.findUnique({
      where: { id: 'singleton' }
    });
    
    // 최근 생성된 사용자들 (최근 10명)
    const recentUsers = await prisma.userCard.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        username: true,
        displayName: true,
        userNumber: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        currentCounter: counter?.counter || 0,
        recentUsers
      }
    });

  } catch (error) {
    console.error('Error in stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
