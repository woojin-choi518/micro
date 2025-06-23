// app/asan/page.tsx
'use client';

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import {
  GoogleMap,
  Marker,
  InfoWindow,
  Polygon,
  useJsApiLoader,
} from '@react-google-maps/api';
import axios from 'axios';
import type { LivestockFarm } from '@/app/lib/types';
import LivestockCombinedFilterPanel from '@/app/components/LivestockCombinedFilterPanel';
import LivestockPieChartPanel from '@/app/components/LivestockPieChartPanel';
import WeatherPanel from '@/app/components/WeatherPanel';
import { scaleRanges } from '@/app/lib/livestockScaleRanges';

const containerStyle = { width: '100%', height: '100vh' };
const ASAN_CENTER = { lat: 36.79, lng: 127.0 };
const DEFAULT_ZOOM = 11;

// 축종별 아이콘 매핑
const iconMap: Record<string, string> = {
  돼지: '/images/pig.png',
  사슴: '/images/deer.png',
  산양: '/images/mountain-goat.png',
  염소: '/images/goat.png',
  오리: '/images/duck.png',
  육우: '/images/cow.png',
  젖소: '/images/cow.png',
  한우: '/images/cow.png',
  메추리: '/images/me.png',
  '종계/산란계': '/images/chicken.png',
  육계: '/images/chicken.png',
};

// 가축 타입 → 규모 그룹 매핑
const typeToGroup: Record<string, string> = {
  한우: '소',
  육우: '소',
  젖소: '소',
  돼지: '돼지',
  '종계/산란계': '닭',
  육계: '닭',
  오리: '오리',
};

export default function FarmMapPage() {
  // — 데이터 & 필터링 상태
  const [farms, setFarms] = useState<LivestockFarm[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedScales, setSelectedScales] = useState<
    Record<string, { min: number; max: number | null }>
  >({});
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const allTypes = useMemo(
    () => Array.from(new Set(farms.map((f) => f.livestock_type))),
    [farms]
  );
  const groupKeys = useMemo(() => Object.keys(scaleRanges), []);
  const initialScales = useMemo(
    () =>
      groupKeys.reduce((acc, g) => {
        const r = scaleRanges[g];
        acc[g] = { min: r[0].min, max: r[r.length - 1].max };
        return acc;
      }, {} as Record<string, { min: number; max: number | null }>),
    [groupKeys]
  );

  // — 날씨 상태
  const [windDir, setWindDir] = useState<number>(0);
  const [humidity, setHumidity] = useState<number>(50);

  // — 파이 차트 토글
  const [isChartOpen, setChartOpen] = useState(false);
  const toggleChart = useCallback(() => setChartOpen((v) => !v), []);

  // — Google Maps API 로더 (geometry 필요)
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['geometry'],
  });

  // — 농가 데이터 로드
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/asan-farm');
        if (!res.ok) throw new Error(`API ${res.status}`);
        setFarms(await res.json());
      } catch (e) {
        console.error(e);
        alert('농가 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    })();
  }, []);

  // — 날씨 데이터 로드
  useEffect(() => {
    (async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
        const lat = 36.7998, lon = 127.1375;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const { data } = await axios.get(url);
        setWindDir(data.wind.deg ?? 0);
        setHumidity(data.main.humidity ?? 50);
      } catch (e) {
        console.error('Weather API error', e);
      }
    })();
  }, []);

  // — 필터 초기화
  useEffect(() => {
    setSelectedTypes(allTypes);
  }, [allTypes]);
  useEffect(() => {
    setSelectedScales(initialScales);
  }, [initialScales]);

  // — 필터 토글 핸들러
  const handleToggleType = useCallback((t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }, []);
  const handleToggleAllTypes = useCallback(() => {
    setSelectedTypes((prev) =>
      prev.length === allTypes.length ? [] : allTypes
    );
  }, [allTypes]);
  const handleScaleChange = useCallback(
    (group: string, range: { min: number; max: number | null }) => {
      setSelectedScales((prev) => ({ ...prev, [group]: range }));
    },
    []
  );

  // — 필터링된 농가
  const visibleFarms = useMemo(() => {
    return farms
      .filter((f) => selectedTypes.includes(f.livestock_type))
      .filter((f) => {
        const grp = typeToGroup[f.livestock_type];
        if (!grp) return true;
        const { min, max } = selectedScales[grp] || { min: 0, max: null };
        if (f.livestock_count < min) return false;
        if (max !== null && f.livestock_count >= max) return false;
        return true;
      });
  }, [farms, selectedTypes, selectedScales]);

  // — 사육두수 최대치 (반경 비례용)
  const maxCount = useMemo(
    () => Math.max(1, ...farms.map((f) => f.livestock_count)),
    [farms]
  );

  // — 악취 범위 폴리곤 생성
  const odorPolygons = useMemo(() => {
    if (!isLoaded) return [];
    return visibleFarms.map((farm) => {
      const origin = new window.google.maps.LatLng(farm.lat, farm.lng);

      // 기본 300m ~ 최대 3000m
      const base = 500;
      const extra = ((farm.livestock_count / maxCount) * (5000 - 500));
      let radius = base + extra;

      // 습도 비례
      radius *= humidity / 100;

      //축종별 악취 강도 계수 적용
      const multMap: Record<string, number> ={
        돼지: 12,
        '종계/산란계': 7,
        육계: 7
      };
      const factor = multMap[farm.livestock_type] ?? 1;
      radius *= factor;

      // 풍향 ±30° 범위로 25 포인트
      const path: google.maps.LatLngLiteral[] = [];
      for (let d = -30; d <= 30; d += 2.5) {
        const angle = (windDir + d + 360) % 360;
        const p = window.google.maps.geometry.spherical.computeOffset(
          origin,
          radius,
          angle
        );
        path.push({ lat: p.lat(), lng: p.lng() });
      }
      path.push({ lat: origin.lat(), lng: origin.lng() });

      return { farmId: farm.id, path };
    });
  }, [visibleFarms, windDir, humidity, maxCount, isLoaded]);

  const selectedFarm = farms.find((f) => f.id === selectedId) ?? null;

  // 로딩/에러 처리
  if (loadError) return <div>지도 로딩 실패</div>;
  if (!isLoaded) return <div>지도 로딩 중…</div>;

  return (
    <div className="relative">
      {/* ◼ 통합 필터 (좌상단) */}
      <div className="absolute top-4 left-4 z-20">
        <LivestockCombinedFilterPanel
          livestockTypes={allTypes}
          selectedTypes={selectedTypes}
          onToggleType={handleToggleType}
          onToggleAllTypes={handleToggleAllTypes}
          allTypesSelected={selectedTypes.length === allTypes.length}
          onScaleChange={handleScaleChange}
        />
      </div>

      {/* ◼ Google Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={ASAN_CENTER}
        zoom={DEFAULT_ZOOM}
        options={{ disableDefaultUI: true, zoomControl: true }}
      >
        {/* 1) 농가 마커 */}
        {visibleFarms.map((farm) => (
          <Marker
            key={farm.id}
            position={{ lat: farm.lat, lng: farm.lng }}
            icon={{
              url: iconMap[farm.livestock_type] || '/images/default.png',
              scaledSize: new window.google.maps.Size(
                farm.id === selectedId ? 50 : 40,
                farm.id === selectedId ? 50 : 40
              ),
              anchor: new window.google.maps.Point(20, 40),
            }}
            animation={
              farm.id === selectedId
                ? window.google.maps.Animation.BOUNCE
                : undefined
            }
            onClick={() => setSelectedId(farm.id)}
            title={farm.farm_name}
            zIndex={0}
          />
        ))}

        {/* 2) 악취 범위 폴리곤 */}
        {odorPolygons.map(({ farmId, path }) => (
          <Polygon
            key={farmId}
            paths={path}
            options={{
              strokeColor: '#FF0000',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#FF0000',
              fillOpacity: 0.4,
              zIndex: 1000,
            }}
          />
        ))}
        {/* 3) InfoWindow */}
        {selectedFarm && (
          <InfoWindow
            key={selectedFarm.id}
            position={{
              lat: selectedFarm.lat,
              lng: selectedFarm.lng,
            }}
            onCloseClick={() => setSelectedId(null)}
            options={{ pixelOffset: new window.google.maps.Size(0, -50) }}
          >
            <div className="bg-white/80 backdrop-blur-md border-2 border-green-300 rounded-xl p-4 w-96 text-gray-800 space-y-3 text-sm font-sans">
              <h3 className="text-lg font-bold text-green-700 mb-2">
                {selectedFarm.farm_name}
              </h3>
                {/* 축종 */}
           <div className="flex items-center gap-2">
             <span className="
               font-medium text-green-600 bg-green-100
               px-4 py-2 rounded-full
               flex justify-center items-center min-w-[5rem]
             ">
               축종
             </span>
             <span className="text-gray-800 flex-grow">
               {selectedFarm.livestock_type}
             </span>
           </div>

           {/* 사육두수 */}
           <div className="flex items-center gap-2">
             <span className="
               font-medium text-green-600 bg-green-100
               px-4 py-2 rounded-full
               flex justify-center items-center min-w-[5rem]
             ">
               사육두수
             </span>
             <span className="text-gray-800 flex-grow">
               {selectedFarm.livestock_count.toLocaleString()}두
             </span>
           </div>

           {/* 면적 */}
           <div className="flex items-center gap-2">
             <span className="
               font-medium text-green-600 bg-green-100
               px-4 py-2 rounded-full
               flex justify-center items-center min-w-[5rem]
             ">
               면적
             </span>
             <span className="text-gray-800 flex-grow">
               {selectedFarm.area_sqm.toLocaleString()}㎡
             </span>
           </div>
           {/* 도로명 주소 */}
           <div className="flex items-center gap-2">
             <span className="
               font-medium text-green-600 bg-green-100
               px-4 py-2 rounded-full
               flex justify-center items-center min-w-[5rem]
             ">
               도로명
             </span>
             <span className="text-gray-800 flex-grow">
               {selectedFarm.road_address || '없음'}
             </span>
           </div>

           {/* 지번 주소 */}
           <div className="flex items-center gap-2">
             <span className="
               font-medium text-green-600 bg-green-100
               px-4 py-2 rounded-full
               flex justify-center items-center min-w-[5rem]
             ">
               지번
             </span>
             <span className="text-gray-800 flex-grow">
               {selectedFarm.land_address || '없음'}
             </span>
           </div>
         </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* ◼ 날씨 패널 (우상단) */}
      <div className="absolute top-4 right-4 z-20">
        <WeatherPanel />
      </div>

      {/* ◼ 파이 차트 패널 (좌하단) */}
      <div className="absolute bottom-2 left-4 z-20">
        <LivestockPieChartPanel
          farms={farms}
          isOpen={isChartOpen}
          onToggle={toggleChart}
        />
      </div>
    </div>
  );
}
