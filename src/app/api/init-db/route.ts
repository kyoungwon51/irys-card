import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔧 Creating database schema...');
    
    // Raw SQL로 테이블 직접 생성
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "card_counter" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "counter" INTEGER NOT NULL DEFAULT 0
      );
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "user_cards" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "displayName" TEXT NOT NULL,
        "userNumber" INTEGER NOT NULL UNIQUE,
        "profileImage" TEXT,
        "bio" TEXT,
        "followers" INTEGER,
        "following" INTEGER,
        "verified" BOOLEAN NOT NULL DEFAULT false,
        "location" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('✅ Tables created successfully');
    
    // 카운터 초기화
    await prisma.$executeRaw`
      INSERT INTO "card_counter" ("id", "counter") 
      VALUES ('singleton', 0) 
      ON CONFLICT ("id") DO NOTHING;
    `;
    
    console.log('✅ Counter initialized');
    
    // 테이블 확인
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('card_counter', 'user_cards');
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Database schema created successfully',
      tables: tableCheck
    });
    
  } catch (error) {
    console.error('❌ Schema creation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
