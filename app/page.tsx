import FeatureWrapper from '@/app/components/home/FeatureWrapper';

export const revalidate = 0; // 매 요청마다 SSR

export default function Page() {
  return (
    <main>
      <FeatureWrapper />
    </main>
  );
}