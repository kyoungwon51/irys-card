# Monad Cards - AI Twitter Profile Card Generator

트위터 프로필을 연결하여 AI 분석 기반의 Monad Cards 스타일 카드를 생성하는 웹 애플리케이션입니다.

## 기능

- 🎨 Twitter OAuth 연결
- 🤖 OpenAI GPT를 활용한 트윗 내용 분석
- 🎭 Replicate API를 통한 애니메 스타일 프로필 이미지 변환
- 📱 반응형 디자인
- 💾 카드 다운로드 기능
- ✨ Monad Cards 스타일의 아름다운 디자인

## 기술 스택

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **AI/ML**: OpenAI GPT, Replicate
- **Card Generation**: HTML2Canvas

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수들을 설정하세요:

```env
# Twitter API (X API) 설정
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# OpenAI API 설정
OPENAI_API_KEY=your_openai_api_key

# Replicate API 설정 (애니메 스타일 변환용)
REPLICATE_API_TOKEN=your_replicate_api_token

# NextAuth 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# 데이터베이스 (선택사항)
DATABASE_URL="file:./dev.db"
```

### 3. API 키 발급 방법

#### Twitter API
1. [Twitter Developer Portal](https://developer.twitter.com/)에서 앱 생성
2. API Key와 API Secret Key 복사
3. OAuth 2.0 설정에서 `http://localhost:3000/api/auth/callback/twitter` 추가

#### OpenAI API
1. [OpenAI Platform](https://platform.openai.com/)에서 API 키 생성
2. 사용량에 따른 요금이 발생할 수 있습니다

#### Replicate API
1. [Replicate](https://replicate.com/)에서 계정 생성
2. API 토큰 생성

### 4. 개발 환경 실행

```bash
npm run dev
```

개발 서버가 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

## 사용법

1. 웹사이트에 접속
2. "Twitter로 연결하기" 버튼 클릭
3. Twitter OAuth 인증 완료
4. "AI 카드 생성하기" 버튼으로 개인화된 카드 생성
5. "카드 다운로드" 버튼으로 PNG 파일 저장

## 데모 모드

API 키가 설정되지 않은 경우, 샘플 카드가 표시되는 데모 모드로 동작합니다.

## 빌드 및 배포

### 빌드

```bash
npm run build
```

### 프로덕션 실행

```bash
npm run start
```

## 주의사항

- API 사용량에 따른 요금이 발생할 수 있습니다
- Twitter API는 사용 제한이 있을 수 있습니다
- 개인정보 보호를 위해 환경 변수를 안전하게 관리하세요

## 향후 개선 계획

- [ ] 더 다양한 카드 템플릿
- [ ] 소셜 미디어 공유 기능
- [ ] 카드 커스터마이징 옵션
- [ ] 배치 처리 기능
- [ ] 사용자 대시보드

## 라이선스

MIT License
