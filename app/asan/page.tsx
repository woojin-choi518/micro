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
import CircleOverlay from '@/app/components/asan/CircleOverlay';


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
  기타: { stroke: '#8884FF' },  // 다크그레이
};

export default function FarmMapPage() {
  // 데이터 & 필터링
  const [farms, setFarms] = useState<LivestockFarm[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["한우","돼지","젖소","육우"]);
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

  // **시나리오 선택**: 'worst', 'average', 'best'
  const [scenario, setScenario] = useState<'worst'|'average'|'best'>('average');

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
  const [windSpeed, setWindSpeed] = useState(1); // 기본값 1m/s

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
        setWindSpeed(data.wind.speed ?? 1);
      } catch(e) {
        console.error('Weather API error', e);
      }
    };
    fetchWeather();
    const iv = setInterval(fetchWeather, 300_000);
    return () => clearInterval(iv);
  }, []);

  // 축종 필터 핸들러
  //useEffect(() => { setSelectedTypes(allTypes); }, [allTypes]);
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

  // 시나리오별 파라미터 오버라이드
  const { scWindSpeed, scHumidity, scStability } = useMemo(() => {
    switch(scenario) {
      case 'worst':
        return { scWindSpeed: 1.0, scHumidity: 98, scStability: 'stable'  };
      case 'best':
        return { scWindSpeed: 3.6, scHumidity: 0,  scStability: 'unstable'};
      case 'average':
      default:
        return { scWindSpeed: windSpeed, scHumidity: humidity, scStability: 'neutral' };
    }
  }, [scenario, windSpeed, humidity]);

   // odorFans: 시나리오별 파라미터 적용
   const odorFans = useMemo(() => {
    if (!map) return [];
    const halfAngle = 30;
    const baseRadius = 500;
    const maxRadius  = 5000;
    const typeMultiplier: Record<string, number> = {
      돼지: 1.5, 육계: 0.7, '종계/산란계': 0.7,
      소: 1.0, 사슴: 0.8,
    };

    return visibleFarms.map(farm => {
      const center = { lat: farm.lat, lng: farm.lng };
      const livestockMul = typeMultiplier[farm.livestock_type] || 1;
      const extraRadius   = (farm.livestock_count / maxCount) * (maxRadius - baseRadius);

      // **시나리오 풍속·습도·안정도** 사용
      let r = (baseRadius + extraRadius) * livestockMul;
      // 풍속 보정
      if (scWindSpeed <= 0.5)      r *= 1.5;
      else if (scWindSpeed >= 1.5) r *= 0.7;
      // 안정도 보정
      r *= scStability === 'stable'   ? 1.4
         : scStability === 'unstable' ? 0.8
         : 1.0;
      // 습도 보정 (0~30% 선형)
      r *= 1 + (scHumidity/100)*0.3;

      // 풍향
      const targetDir = windDir % 360;
      const startA = (targetDir - halfAngle + 360) % 360;
      const endA   = (targetDir + halfAngle + 360) % 360;

      return { farmId: farm.id, type: farm.livestock_type, center, radius: r, startA, endA };
    });
  }, [visibleFarms, windDir, scWindSpeed, scHumidity, scStability, maxCount, map]);


  const selectedFarm = farms.find(f=>f.id===selectedId)||null;

  if (loadError) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-red-500 text-center">
        지도 로딩 실패
        <button
          onClick={() => window.location.reload()}
          className="ml-2 bg-blue-500 text-white px-2 py-1 rounded"
        >
          재시도
        </button>
      </div>
    </div>
  );
  if (!isLoaded) return <div className="flex items-center justify-center h-screen">지도 로딩 중…</div>;

  return (
    <div className="relative">
      {/* … 기존 필터 패널 위에 시나리오 선택 UI를 추가 */}
      <div className="fixed bottom-6 right-4 z-50 bg-gradient-to-r from-teal-800/20 to-blue-500/20
                   backdrop-blur-md border-2 border-teal-300
                   rounded-full px-5 py-3 flex items-center justify-between
                   cursor-pointer select-none shadow-md">
        <label className="mr-2 font-semibold text-white-700">시뮬레이션 시나리오:</label>
        <select
          value={scenario}
          onChange={e => setScenario(e.target.value as any)}
          className="bg-white/80 border border-gray-300 rounded-md px-3 py-1 text-gray-800 font-sans text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-colors duration-200"
        >
          <option value="worst">악취 강함 (역전층·무풍·높은 습도)</option>
          <option value="average">실시간</option>
          <option value="best">악취 약함 (불안정·강풍·낮은 습도)</option>
        </select>
      </div>
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
            <React.Fragment key={f.farmId}>
              {/* 1) 주변 풀 서클: 반경 그대로 */}
              <CircleOverlay
                map={map}
                center={f.center}
                radius={f.radius * 0.6}
                color={stroke}
              />
        
              {/* 2) 방향성 플럼: 기존 섹터 */}
              <SectorOverlay
                map={map}
                center={f.center}
                radius={f.radius * 0.8}
                startAngle={f.startA}
                endAngle={f.endA}
                color={stroke}
              />
            </React.Fragment>
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