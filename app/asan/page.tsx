// app/page.tsx
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
} from '@react-google-maps/api';
import type { LivestockFarm } from '@/app/lib/types';
import LivestockFilterPanel from '@/app/components/LivestockFilterPanel';
import LivestockScaleFilterPanel from '@/app/components/LivestockScaleFilterPanel';
import LivestockPieChartPanel from '@/app/components/LivestockPieChartPanel';
import { scaleRanges } from '@/app/lib/livestockScaleRanges';

const containerStyle = { width: '100%', height: '100vh' };
const ASAN_CENTER = { lat: 36.79, lng: 127.0 };
const DEFAULT_ZOOM = 11;

// 축종별 아이콘 경로 매핑
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
  // 사슴, 염소, 메추리, 산양 등은 규모 필터 미적용
};

export default function FarmMapPage() {
  // 1) 농가 전체 데이터
  const [farms, setFarms] = useState<LivestockFarm[]>([]);
  // 2) InfoWindow 표시용 선택 ID
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 3) 축종 필터 상태
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const allTypes = useMemo(
    () => Array.from(new Set(farms.map((f) => f.livestock_type))),
    [farms]
  );

  // 4) 그룹별 규모 필터 상태
  const groupKeys = useMemo(() => Object.keys(scaleRanges), []);
  const initialScales = useMemo(
    () =>
      groupKeys.reduce((acc, group) => {
        const ranges = scaleRanges[group];
        acc[group] = {
          min: ranges[0].min,
          max: ranges[ranges.length - 1].max,
        };
        return acc;
      }, {} as Record<string, { min: number; max: number | null }>),
    [groupKeys]
  );
  const [selectedScales, setSelectedScales] =
    useState(initialScales);

  // 5) 파이 차트 토글
  const [isChartOpen, setChartOpen] = useState(false);
  const toggleChart = useCallback(
    () => setChartOpen((v) => !v),
    []
  );

  // — 데이터 로드
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const res = await fetch('/api/asan-farm');
        if (!res.ok)
          throw new Error(`API Error: ${res.status}`);
        const data: LivestockFarm[] = await res.json();
        setFarms(data);
      } catch (err) {
        console.error('🚨 농가 데이터 불러오기 실패:', err);
        alert('축산 농가 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    };
    fetchFarms();
  }, []);

  // — 초기 축종 전체 선택
  useEffect(() => {
    setSelectedTypes(allTypes);
  }, [allTypes]);

  // 축종 토글 핸들러
  const handleToggleType = useCallback((type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  }, []);
  // 전체 선택/해제
  const handleToggleAll = useCallback(() => {
    setSelectedTypes((prev) =>
      prev.length === allTypes.length ? [] : allTypes
    );
  }, [allTypes]);

  // 규모 필터 변경 핸들러
  const handleScaleChange = useCallback(
    (group: string, range: { min: number; max: number | null }) => {
      setSelectedScales((prev) => ({
        ...prev,
        [group]: range,
      }));
    },
    []
  );

  // — 필터링 적용 (축종 + 규모)
  const visibleFarms = useMemo(() => {
    return farms
      // 1) 축종 필터
      .filter((f) => selectedTypes.includes(f.livestock_type))
      // 2) 규모 필터 (매핑된 그룹에만)
      .filter((f) => {
        const grp = typeToGroup[f.livestock_type];
        if (!grp) return true;
        const { min, max } = selectedScales[grp];
        if (f.livestock_count < min) return false;
        if (max !== null && f.livestock_count >= max)
          return false;
        return true;
      });
  }, [farms, selectedTypes, selectedScales]);

  const selectedFarm =
    farms.find((f) => f.id === selectedId) ?? null;

    return (
      <div className="relative">
        {/* ◼ 필터 패널: top-left */}
        <div className="absolute top-4 left-4 z-20 flex flex-col space-y-4 mt-20">
          <LivestockFilterPanel
            livestockTypes={allTypes}
            selected={selectedTypes}
            onToggle={handleToggleType}
            onToggleAll={handleToggleAll}
            allSelected={selectedTypes.length === allTypes.length}
          />
          <LivestockScaleFilterPanel onChange={handleScaleChange} />
        </div>
  
        {/* ◼ Google Map */}
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={ASAN_CENTER}
          zoom={DEFAULT_ZOOM}
          options={{ disableDefaultUI: true, zoomControl: true }}
        >
          {visibleFarms.map(farm => (
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
            />
          ))}
  
          {selectedFarm && (
            <InfoWindow
              key={selectedFarm.id}
              position={{
                lat: selectedFarm.lat,
                lng: selectedFarm.lng,
              }}
              onCloseClick={() => setSelectedId(null)}
              options={{
                pixelOffset: new window.google.maps.Size(0, -50),
                disableAutoPan: false,
              }}
            >
              {/* InfoWindow 내용 */}
              <div className="bg-white/80 backdrop-blur-md border-2 border-green-300 rounded-xl p-4 w-96 text-gray-800 space-y-3 text-sm font-sans">
                <h3 className="text-lg font-bold text-green-700 mb-2">
                  {selectedFarm.farm_name}
                </h3>
                {/* ... */}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
  
        {/* ◼ 파이 차트 패널: bottom-left */}
        <div className="absolute bottom-4 left-4 z-20">
          <LivestockPieChartPanel
            farms={farms}
            isOpen={isChartOpen}
            onToggle={toggleChart}
          />
        </div>
      </div>
    );
  }