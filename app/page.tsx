import FeatureSection from '@/app/components/home/FeatureSection';
import HeroSection from '@/app/components/home/HeroSection';


export const revalidate = 0;  // 매 요청마다 SSR

export default function Page() {
  return (
    <main>
      {/* Hero 영역 */}
      <section className="relative flex justify-center items-center h-screen">
        <HeroSection />
      </section>

      {/* Feature 섹션 (SSR) */}
      {[
        // {
        //   title: 'Map · Sample Searching',
        //   subTitle:'미생물 샘플, \n지도에서 간편하게',
        //   description: 'Earth Microbiome Project의 60개 지역, 32개 환경에서 채집한 8,861개의 샘플을 편리하게 검색해보세요.',
        //   image1: { src: '/images/search1.webp', alt: 'Search 화면 1' },
        //   image2: { src: '/images/search2.webp', alt: 'Search 화면 2' },
        // },
        // {
        //   title: 'Similarity · 샘플 간 유사도 분석',
        //   subTitle:'유사도 분석, \n직관적인 GraphDB로! ',
        //   description: 'Neo4j 그래프 DB로 관계 기반 분석을 지원합니다.',
        //   image1: { src: '/images/graph1.webp', alt: 'Search 화면 1' },
        //   image2: { src: '/images/graph2.webp', alt: 'Search 화면 2' },
        // },
        // {
        //   title: 'Polar · 극지방 미생물 탐색',
        //   subTitle:'극지방의 미생물, \n연도별 변화를 확인해보세요 ',
        //   description: 'NCBI, PAMC에서 30여년간 수집한 40000개 이상의 데이터를 한눈에 확인해보세요. 연도별 미생물 변화와 좌표별 미생물 분포도 확인할 수 있습니다.',
        //   image1: { src: '/images/polar1.webp', alt: 'Search 화면 1' },
        //   image2: { src: '/images/polar2.webp', alt: 'Search 화면 2' },
        // },
        // {
        //   title: 'Trees · 아산시 보호수 지도',
        //   subTitle:'소중한 보호수, \n검색할 필요없이 \n한눈에 알아보세요! ',
        //   description: '아산시의 약 800개의 보호수, 검색하시지 않아도 한눈에 보실 수 있어요. 필요하신 정보를 편하게 확인하세요.',
        //   image1: { src: '/images/tree1.webp', alt: 'Search 화면 1' },
        //   image2: { src: '/images/tree2.webp', alt: 'Search 화면 2' },
        // },
        // {
        //   title: 'Crops · 곡물 생산량 분석',
        //   subTitle:'작물 생산량과 미생물, \n둘 사이의 연관성을 확인해보세요.',
        //   description: '미생물 다양성과 작물 생산성이 비례한다는 사실, 알고계셨나요? 실제 논문을 기반으로 한 데이터를 확인해보세요.',
        //   image1: { src: '/images/crop1.webp', alt: 'Search 화면 1' },
        //   image2: { src: '/images/crop2.webp', alt: 'Search 화면 2' },
        // },
        {
          title: 'Asan · 아산시 악취 지도',
          subTitle:'집 주변 악취 범위, \n날씨 기반으로 계산해서 알려드려요. ',
          description: '아산시에 위치한 722개 농장과 날씨 데이터를 활용해서 악취 범위를 계산해요. 실시간 악취 범위와 5일 이후까지의 악취 예측 범위를 확인할 수 있어요.',
          image1: { src: '/images/farm1.webp', alt: 'Search 화면 1' },
          image2: { src: '/images/farm2.webp', alt: 'Search 화면 2' },
        },
      ].map((f, i) => (
        <section
          key={i}
          className={`py-32 ${
            i % 2 ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
          }`}
        >
          <FeatureSection {...f} />
        </section>
      ))}

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800">
        Data Source: EMP | NCBI | PAMC | KOPRI | SMU
      </footer>
    </main>
  );
}