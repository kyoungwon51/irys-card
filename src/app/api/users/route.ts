import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API /users POST request received');
    
    const body = await request.json();
    const { 
      username, 
      displayName, 
      profileImage, 
      bio, 
      followers, 
      following, 
      verified, 
      location 
    } = body;

    console.log('📝 Request data:', { username, displayName });

    if (!username || !displayName) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Username and displayName are required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking for existing user:', username);
    
    // 기존 사용자 확인
    const existingUser = await prisma.userCard.findUnique({
      where: { username }
    });

    console.log('👤 Existing user found:', !!existingUser);

    if (existingUser) {
      console.log('✅ Returning existing user with number:', existingUser.userNumber);
      
      // 기존 사용자인 경우 정보 업데이트하고 기존 번호 반환
      const updatedUser = await prisma.userCard.update({
        where: { username },
        data: {
          displayName,
          profileImage,
          bio,
          followers,
          following,
          verified,
          location
        }
      });
      
      return NextResponse.json({
        success: true,
        userNumber: updatedUser.userNumber,
        isNewUser: false,
        user: updatedUser
      });
    }

    console.log('🆕 Creating new user...');

    // 새 사용자인 경우 카운터 증가 및 새 번호 할당
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      console.log('🔄 Starting transaction...');
      
      // 카운터 가져오기 또는 생성
      let counter = await tx.cardCounter.findUnique({
        where: { id: 'singleton' }
      });

      console.log('📊 Current counter:', counter);

      if (!counter) {
        console.log('🏗️ Creating initial counter...');
        counter = await tx.cardCounter.create({
          data: { id: 'singleton', counter: 0 }
        });
      }

      console.log('⬆️ Incrementing counter from', counter.counter, 'to', counter.counter + 1);

      // 카운터 증가
      const updatedCounter = await tx.cardCounter.update({
        where: { id: 'singleton' },
        data: { counter: counter.counter + 1 }
      });

      console.log('✅ Counter updated to:', updatedCounter.counter);

      // 새 사용자 생성
      const newUser = await tx.userCard.create({
        data: {
          username,
          displayName,
          userNumber: updatedCounter.counter,
          profileImage,
          bio,
          followers,
          following,
          verified,
          location
        }
      });

      console.log('👤 New user created with number:', newUser.userNumber);

      return { user: newUser, counter: updatedCounter.counter };
    });

    console.log('🎉 Transaction completed successfully! Returning user number:', result.counter);

    return NextResponse.json({
      success: true,
      userNumber: result.counter,
      isNewUser: true,
      user: result.user
    });

  } catch (error) {
    console.error('❌ Error in register-user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 사용자 정보 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 }
      );
    }

    const user = await prisma.userCard.findUnique({
      where: { username }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error in get user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
