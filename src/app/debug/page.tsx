'use client';

export default function DebugPage() {
  const checkEnvVars = () => {
    const envStatus = {
      NEXTAUTH_URL: typeof window !== 'undefined' ? window.location.origin : 'Not available',
      hasTwitterClientId: !!process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID || 'Check server logs',
    };
    
    console.log('Environment status:', envStatus);
    return envStatus;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h1 className="text-2xl font-bold text-white mb-6">환경 변수 디버그</h1>
        
        <div className="space-y-4 text-white">
          <div>
            <h2 className="text-lg font-semibold mb-2">현재 URL</h2>
            <p className="bg-black/20 p-2 rounded">{typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">필요한 환경 변수</h2>
            <ul className="space-y-2 text-sm">
              <li>• TWITTER_CLIENT_ID</li>
              <li>• TWITTER_CLIENT_SECRET</li>
              <li>• NEXTAUTH_URL</li>
              <li>• NEXTAUTH_SECRET</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Vercel 환경 변수 설정 단계</h2>
            <ol className="space-y-2 text-sm">
              <li>1. <a href="https://vercel.com/kys-projects-36303bf6/irys-card" className="text-blue-300 underline">Vercel 대시보드</a>로 이동</li>
              <li>2. Settings → Environment Variables 클릭</li>
              <li>3. 환경 변수 추가:</li>
              <li className="ml-4">• TWITTER_CLIENT_ID: [Twitter App의 Client ID]</li>
              <li className="ml-4">• TWITTER_CLIENT_SECRET: [Twitter App의 Client Secret]</li>
              <li className="ml-4">• NEXTAUTH_URL: https://irys-card-7zxuuwtu6-kys-projects-36303bf6.vercel.app</li>
              <li className="ml-4">• NEXTAUTH_SECRET: [랜덤 문자열]</li>
              <li>4. 변수 추가 후 자동 재배포 대기</li>
            </ol>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Twitter Developer Portal 설정</h2>
            <ol className="space-y-2 text-sm">
              <li>1. <a href="https://developer.twitter.com/en/portal/dashboard" className="text-blue-300 underline">Twitter Developer Portal</a>로 이동</li>
              <li>2. App Settings → Authentication settings</li>
              <li>3. OAuth 2.0 Settings 활성화</li>
              <li>4. Type of App: Web App</li>
              <li>5. Website URL: https://irys-card-7zxuuwtu6-kys-projects-36303bf6.vercel.app</li>
              <li>6. Callback URLs: https://irys-card-7zxuuwtu6-kys-projects-36303bf6.vercel.app/api/auth/callback/twitter</li>
              <li>7. Save 클릭</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
