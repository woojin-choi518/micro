//app/cesium/ClientWrapper.tsx
'use client';

import dynamic from 'next/dynamic';

// `ssr: false`를 사용하려면 클라이언트 컴포넌트에서 감싸야 함
const CesiumViewer = dynamic(() => import('@/app/components/CesiumViewer'), {
  ssr: false,
});

export default function ClientWrapper() {
  return <CesiumViewer />;
}
