'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  GoogleMap,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import type { LivestockFarm } from '@/app/lib/types';
import LivestockFilterPanel from '@/app/components/LivestockFilterPanel';
import LivestockPieChartPanel from '@/app/components/LivestockPieChartPanel';

const containerStyle = { width: '100%', height: '100vh' };
const ASAN_CENTER = { lat: 36.79, lng: 127.0 };
const DEFAULT_ZOOM = 11;

// 축종별 아이콘 매핑
const iconMap: Record<string, string> = {
  '돼지': '/images/pig.png',
  '사슴': '/images/deer.png',
  '산양': '/images/mountain-goat.png',
  '염소': '/images/goat.png',
  '오리': '/images/duck.png',
  '육우': '/images/cow.png',
  '젖소': '/images/cow.png',
  '한우': '/images/cow.png',
  '메추리': '/images/me.png',
  '종계/산란계': '/images/chicken.png',
  '육계': '/images/chicken.png',
};

export default function FarmMapPage() {
  const [farms, setFarms] = useState<LivestockFarm[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 농가 데이터 가져오기
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const res = await fetch('/api/asan-farm');
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const data: LivestockFarm[] = await res.json();
        setFarms(data);
      } catch (err) {
        console.error('🚨 농가 데이터 불러오기 실패:', err);
        alert('축산 농가 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    };
    fetchFarms();
  }, []);

  const selectedFarm = farms.find((f) => f.id === selectedId) ?? null;

  // 축종 필터 상태
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const allTypes = useMemo(() => Array.from(new Set(farms.map(f => f.livestock_type))), [farms]);
  useEffect(() => {
    setSelectedTypes(allTypes); // 초기에 전체 선택
  }, [allTypes]);

  const handleToggleType = useCallback((type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedTypes(selectedTypes.length === allTypes.length ? [] : allTypes);
  }, [selectedTypes, allTypes]);

  const visibleFarms = useMemo(() => farms.filter(f => selectedTypes.includes(f.livestock_type)), [farms, selectedTypes]);
  const [isChartOpen, setChartOpen] = useState(true);
  const toggleChart = useCallback(() => setChartOpen(v => !v), []);

  

  return (
    <div className="relative">
      {/* 필터 패널 */}
      <div className="absolute top-4 left-4 z-10">
        <LivestockFilterPanel
          livestockTypes={allTypes}
          selected={selectedTypes}
          onToggle={handleToggleType}
          onToggleAll={handleToggleAll}
          allSelected={selectedTypes.length === allTypes.length}
        />
      </div>

      {/* 지도 */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={ASAN_CENTER}
        zoom={DEFAULT_ZOOM}
        options={{ disableDefaultUI: true, zoomControl: true }}
      >
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
            animation={farm.id === selectedId ? window.google.maps.Animation.BOUNCE : undefined}
            onClick={() => setSelectedId(farm.id)}
            title={farm.farm_name}
          />
        ))}

        <LivestockPieChartPanel
            farms={farms}
            isOpen={isChartOpen}
            onToggle={toggleChart}
        />

        {selectedFarm && (
          <InfoWindow
            key={selectedFarm.id}
            position={{ lat: selectedFarm.lat, lng: selectedFarm.lng }}
            onCloseClick={() => setSelectedId(null)}
            options={{
              pixelOffset: new window.google.maps.Size(0, -50),
              disableAutoPan: false,
            }}
          >
            <div
              className="
                bg-white/80 backdrop-blur-md
                border-2 border-green-300
                rounded-xl
                p-4
                w-96
                text-gray-800
                space-y-3
                text-sm
                font-sans
                text-left
                relative
              "
            >
              <h3 className="text-lg font-bold text-green-700 mb-2">{selectedFarm.farm_name}</h3>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600 bg-green-100 px-4 py-2 rounded-full flex justify-center items-center min-w-[5rem]">축종</span>
                <span className="text-gray-800 flex-grow">{selectedFarm.livestock_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600 bg-green-100 px-4 py-2 rounded-full flex justify-center items-center min-w-[5rem]">사육두수</span>
                <span className="text-gray-800 flex-grow">{selectedFarm.livestock_count.toLocaleString()}두</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600 bg-green-100 px-4 py-2 rounded-full flex justify-center items-center min-w-[5rem]">면적</span>
                <span className="text-gray-800 flex-grow">{selectedFarm.area_sqm.toLocaleString()}㎡</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600 bg-green-100 px-4 py-2 rounded-full flex justify-center items-center min-w-[5rem]">도로명</span>
                <span className="text-gray-800 flex-grow">{selectedFarm.road_address || '없음'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600 bg-green-100 px-4 py-2 rounded-full flex justify-center items-center min-w-[5rem]">지번</span>
                <span className="text-gray-800 flex-grow">{selectedFarm.land_address || '없음'}</span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}