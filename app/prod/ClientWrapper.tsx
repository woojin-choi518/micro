//app/cesium/ClientWrapper.tsx
'use client';

import dynamic from 'next/dynamic';

// `ssr: false`를 사용하려면 클라이언트 컴포넌트에서 감싸야 함
const CesiumSoy = dynamic(() => import('@/app/components/CesiumSoy'), {
  ssr: false,
});

export default function ClientWrapper() {
  return <CesiumSoy />;
}
