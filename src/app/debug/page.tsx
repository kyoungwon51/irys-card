'use client';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h1 className="text-2xl font-bold text-white mb-6">환경 변수 디버그</h1>
        
        <div className="space-y-4 text-white">
          <p>모든 환경 변수가 올바르게 설정되었는지 확인해주세요:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>TWITTER_CLIENT_ID</li>
            <li>TWITTER_CLIENT_SECRET</li>
            <li>NEXTAUTH_URL</li>
            <li>NEXTAUTH_SECRET</li>
          </ul>
          <p className="mt-4 text-sm text-gray-300">
            Vercel Dashboard에서 환경 변수 설정을 확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
