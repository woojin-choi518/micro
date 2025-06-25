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
  useJsApiLoader,
} from '@react-google-maps/api';
import axios from 'axios';
import type { LivestockFarm } from '@/app/lib/types';
import LivestockCombinedFilterPanel from '@/app/components/asan/LivestockCombinedFilterPanel';
import LivestockPieChartPanel from '@/app/components/asan/LivestockPieChartPanel';
import WeatherPanel from '@/app/components/asan/WeatherPanel';
import SectorOverlay from '@/app/components/asan/SectorOverlay';

const containerStyle = { width: '100%', height: '100vh' };
const ASAN_CENTER = { lat: 36.7855, lng: 127.102 };
const DEFAULT_ZOOM = 13;

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

// 축종별 색상 맵
const odorColorMap: Record<string, { stroke: string }> = {
  닭:   { stroke: '#FFA500' },  // 오렌지
  소:   { stroke: '#1E90FF' },  // 블루
  돼지: { stroke: '#FF69B4' },  // 핫핑크
  사슴: { stroke: '#32CD32' },  // 라임그린
  기타: { stroke: '#A9A9A9' },  // 다크그레이
};

export default function FarmMapPage() {
  // 데이터 & 필터링
  const [farms, setFarms] = useState<LivestockFarm[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedScales, setSelectedScales] = useState<Record<string, { min: number; max: number | null }>>({});
  const [selectedId, setSelectedId] = useState<number|null>(null);

  const allTypes = useMemo(
    () => Array.from(new Set(farms.map(f => f.livestock_type))),
    [farms]
  );

  // 날씨 상태
  const [windDir, setWindDir] = useState(0);
  const [humidity, setHumidity] = useState(50);

  // 차트, 필터, 맵 레퍼런스
  const [isChartOpen, setChartOpen] = useState(false);
  const toggleChart = useCallback(() => setChartOpen(v => !v), []);

  const [showOdor, setShowOdor] = useState(true);
  const [map, setMap] = useState<google.maps.Map|null>(null);

  // 구글 맵 로더
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['geometry'],
  });

  // 농가 데이터 fetch
  useEffect(() => {
    fetch('/api/asan-farm')
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data: LivestockFarm[]) => setFarms(data))
      .catch(err => {
        console.error(err);
        alert('농가 데이터를 불러오는 중 오류가 발생했습니다.');
      });
  }, []);

  // 날씨 데이터 fetch
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
        if (!apiKey) return;
        const lat = 36.7998, lon = 127.1375;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const { data } = await axios.get(url);
        setWindDir(data.wind.deg ?? 0);
        setHumidity(data.main.humidity ?? 50);
      } catch(e) {
        console.error('Weather API error', e);
      }
    };
    fetchWeather();
    const iv = setInterval(fetchWeather, 300_000);
    return () => clearInterval(iv);
  }, []);

  // 축종 필터 핸들러
  useEffect(() => { setSelectedTypes(allTypes); }, [allTypes]);
  const handleToggleType = useCallback((t: string) => {
    setSelectedTypes(prev =>
      prev.includes(t) ? prev.filter(x => x!==t) : [...prev, t]
    );
  }, []);
  const handleToggleAll = useCallback(() => {
    setSelectedTypes(prev =>
      prev.length === allTypes.length ? [] : allTypes
    );
  }, [allTypes]);

  // 규모 필터 핸들러
  const handleScaleChange = useCallback(
    (grp: string, range: {min:number;max:number|null}) => {
      setSelectedScales(prev => ({ ...prev, [grp]: range }));
    },
    []
  );

  // 필터링된 농가
  const visibleFarms = useMemo(() => {
    return farms
      .filter(f => selectedTypes.includes(f.livestock_type))
      .filter(f => {
        const grp = typeToGroup[f.livestock_type];
        if (!grp) return true;
        const {min, max} = selectedScales[grp]||{min:0,max:null};
        if (f.livestock_count < min) return false;
        if (max!==null && f.livestock_count >= max) return false;
        return true;
      });
  }, [farms, selectedTypes, selectedScales]);

  // 최대 사육두수
  const maxCount = useMemo(
    () => farms.length ? Math.max(...farms.map(f=>f.livestock_count)) : 1,
    [farms]
  );

  // Fan-shape 생성 정보
  const odorFans = useMemo(() => {
    if (!map) return [];
    const halfAngle = 30;
    return visibleFarms.map(farm => {
      const center = { lat: farm.lat, lng: farm.lng };
      const base = 500;
      const extra = (farm.livestock_count / maxCount) * (5000 - 500);
      let r = (base + extra) * (humidity/100);
      const mul: Record<string, number> = {
        돼지: 15, '종계/산란계': 7, 육계: 7
      };
      r *= mul[farm.livestock_type]||1;

      // 바람이 가는 방향 (풍향 + 180°)
      const targetDir = (windDir) % 360;
      const startA = (targetDir - halfAngle + 360) % 360;
      const endA = (targetDir + halfAngle + 360) % 360;

      return {
        farmId: farm.id,
        type: farm.livestock_type,
        center,
        radius: r,
        startA,
        endA,
      };
    });
  }, [visibleFarms, windDir, humidity, maxCount, map]);

  const selectedFarm = farms.find(f=>f.id===selectedId)||null;

  if (loadError) return <div>지도 로딩 실패</div>;
  if (!isLoaded) return <div>지도 로딩 중…</div>;

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-20">
        <LivestockCombinedFilterPanel
          livestockTypes={allTypes}
          selectedTypes={selectedTypes}
          onToggleType={handleToggleType}
          onToggleAllTypes={handleToggleAll}
          allTypesSelected={selectedTypes.length===allTypes.length}
          onScaleChange={handleScaleChange}
          showOdor={showOdor}
          onToggleOdor={() => setShowOdor(v=>!v)}
        />
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={ASAN_CENTER}
        zoom={DEFAULT_ZOOM}
        options={{ disableDefaultUI: true, zoomControl: true }}
        onLoad={m => setMap(m)}
      >
        {visibleFarms.map(farm=>(
          <Marker
            key={farm.id}
            position={{ lat: farm.lat, lng: farm.lng }}
            icon={{
              url: iconMap[farm.livestock_type]||'/images/default.png',
              scaledSize: new window.google.maps.Size(
                farm.id===selectedId?50:40,
                farm.id===selectedId?50:40
              ),
              anchor: new window.google.maps.Point(20,40),
            }}
            onClick={()=>setSelectedId(farm.id)}
            title={farm.farm_name}
            zIndex={1}
          />
        ))}

        {showOdor && map && odorFans.map(f=>{
          let cat='기타';
          if (['한우','육우','젖소'].includes(f.type)) cat='소';
          else if (f.type==='돼지') cat='돼지';
          else if (['종계/산란계','육계'].includes(f.type)) cat='닭';
          else if (f.type==='사슴') cat='사슴';
          const { stroke } = odorColorMap[cat];
          return (
            <SectorOverlay
              key={f.farmId}
              map={map}
              center={f.center}
              radius={f.radius}
              startAngle={f.startA}
              endAngle={f.endA}
              color={stroke}
            />
          );
        })}

        {selectedFarm && (
          <InfoWindow
            position={{ lat: selectedFarm.lat, lng: selectedFarm.lng }}
            onCloseClick={()=>setSelectedId(null)}
            options={{ pixelOffset: new window.google.maps.Size(0,-30) }}
          >
            <div className="bg-white/80 backdrop-blur-md border-2 border-green-300 rounded-xl p-4 w-80 text-gray-800 space-y-3 text-sm">
              <h3 className="text-lg font-bold text-green-700">
                {selectedFarm.farm_name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600 bg-green-100 px-4 py-2 rounded-full min-w-[5rem] text-center">축종</span>
                <span>{selectedFarm.livestock_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600 bg-green-100 px-4 py-2 rounded-full min-w-[5rem] text-center">사육두수</span>
                <span>{selectedFarm.livestock_count.toLocaleString()}두</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600 bg-green-100 px-4 py-2 rounded-full min-w-[5rem] text-center">면적</span>
                <span>{selectedFarm.area_sqm.toLocaleString()}㎡</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600 bg-green-100 px-4 py-2 rounded-full min-w-[5rem] text-center">도로명</span>
                <span>{selectedFarm.road_address || '없음'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600 bg-green-100 px-4 py-2 rounded-full min-w-[5rem] text-center">지번</span>
                <span>{selectedFarm.land_address || '없음'}</span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      <div className="absolute top-4 right-4 z-40">
        <WeatherPanel/>
      </div>

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