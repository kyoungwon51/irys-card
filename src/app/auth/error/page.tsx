'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'Twitter OAuth 설정에 문제가 있습니다. 개발자에게 문의하세요.';
      case 'AccessDenied':
        return 'Twitter 로그인 권한이 거부되었습니다.';
      case 'Verification':
        return 'Twitter 인증에 실패했습니다. 다시 시도해주세요.';
      default:
        return 'Twitter 로그인 중 오류가 발생했습니다.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-white mb-4">로그인 오류</h1>
        <p className="text-white/80 mb-6">
          {getErrorMessage(error)}
        </p>
        <div className="space-y-3">
          <Link
            href="/"
            className="block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            홈으로 돌아가기
          </Link>
          <div className="text-white/60 text-sm">
            <p>문제가 계속 발생한다면:</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• Twitter Developer Portal에서 Callback URL 확인</li>
              <li>• OAuth 2.0 설정 확인</li>
              <li>• API 키가 올바른지 확인</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
