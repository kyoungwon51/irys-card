# Twitter OAuth 설정 가이드

## 현재 상황
- 배포 URL: https://irys-card-e07xipxvq-kys-projects-36303bf6.vercel.app
- 환경변수: 모두 설정됨 ✅
- 오류: "앱에 접근할 수 없습니다"

## Twitter Developer Console에서 확인할 것들

### 1. Callback URL 설정
Twitter Developer Console → Your App → Settings → Authentication settings에서:

**추가해야 할 Callback URLs:**
```
https://irys-card-e07xipxvq-kys-projects-36303bf6.vercel.app/api/auth/callback/twitter
```

### 2. App permissions
- Read users
- Read tweets
- (필요시) Write tweets

### 3. Client Type
- Confidential client (권장)

### 4. OAuth 2.0 설정
- OAuth 2.0이 활성화되어 있는지 확인
- OAuth 1.0a는 비활성화

## 확인 방법
1. https://developer.twitter.com/en/portal/dashboard 방문
2. 당신의 앱 선택
3. Settings → Authentication settings
4. Callback URL에 위의 URL이 정확히 입력되어 있는지 확인

## 추가 디버깅
만약 여전히 문제가 발생한다면, Twitter App의 Client ID가 환경변수의 TWITTER_CLIENT_ID와 일치하는지도 확인해주세요.
