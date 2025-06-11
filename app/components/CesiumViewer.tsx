// components/CesiumViewer.tsx
'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  Ion,
  Viewer,
  Math as CesiumMath,
  createWorldImageryAsync,
  CustomDataSource,
  Cartesian3,
  LabelStyle,
  VerticalOrigin,
  CallbackProperty,
  ConstantProperty,
  Color,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

import { Microbe, LocationInfo } from '@/app/lib/types';
import FilterPanel from './FilterPanel';
import PieChartPanel from './PieChartPanel';
import SoybeanMarkers from './SoybeanMarker';
import { useAddPollutantMarkers } from './PollutantMarkers';
import ViolinChartPanel from './ViolinChartPanel';
import FloatingPanel from './FloatingPanel';
import { seedYieldData } from '@/app/lib/seedYieldData';


// Cesium 정적 리소스 경로 설정 (public/Cesium 아래에 리소스가 있어야 함)
declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}
(window as Window).CESIUM_BASE_URL = '/Cesium';

export default function CesiumViewer() {
  // ─────────── 1. Refs & State 선언 ───────────
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<Viewer | null>(null);

  // Microbe 전용 DataSource
  const microbeDataSourceRef = useRef<CustomDataSource | null>(null);
  // Soybean 전용 DataSource
  const soybeanDataSourceRef = useRef<CustomDataSource | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [microbes, setMicrobes] = useState<Microbe[]>([]);
  const [locations, setLocations] = useState<LocationInfo[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isViewerInitialized, setIsViewerInitialized] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Microbe[] | null>(null);

  // 연도 필터 & 애니메이션 관련 상태
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [uniqueYears, setUniqueYears] = useState<number[]>([]);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // organism / sequence 필터
  const [organismFilter, setOrganismFilter] = useState<string>('');
  const [sequenceFilter, setSequenceFilter] = useState<string>('');

  // 패널 열림/닫힘 상태
  const [isYearPanelOpen, setIsYearPanelOpen] = useState<boolean>(false);
  const [isPieChartOpen, setIsPieChartOpen] = useState<boolean>(true);

  // 드롭다운용 고유 organism 목록
  const uniqueOrganisms = useMemo(
    () =>
      Array.from(
        new Set(microbes.map((m) => m.organism).filter((o) => o != null))
      ).sort(),
    [microbes]
  );

  // ─────────── 2. uniqueYears 계산 & 컬러맵 생성 ───────────
  useEffect(() => {
    const years = Array.from(
      new Set(microbes.map((m) => m.year).filter((y): y is number => y != null))
    ).sort();
    setUniqueYears(years);

    // 첫 로딩 시 currentYear, selectedYears 기본값 설정
    if (years.length > 0 && currentYear === null) {
      setCurrentYear(years[0]);
      setSelectedYears(years);
    }
  }, [microbes]);

  const yearColorMap = useMemo(() => {
    const map: Record<number, Color> = {};
    uniqueYears.forEach((year, idx) => {
      const N = uniqueYears.length || 1;
      const hue = (idx / N) * 360;
      map[year] = Color.fromHsl(hue / 360, 0.7, 0.5);
    });
    return map;
  }, [uniqueYears]);

  // ─────────── 3. Microbe 데이터 Fetch ───────────
  useLayoutEffect(() => {
    fetch('/api/microbes')
      .then((res) => res.json())
      .then((data: Microbe[]) => setMicrobes(data))
      .catch((err) => {
        console.error('Fetch /api/microbes error:', err);
        setError('Failed to load microbe data.');
      });
  }, []);

  // ─────────── 4. Soybean(LocationInfo) 데이터 Fetch ───────────
  useLayoutEffect(() => {
    fetch('/api/soybean')
      .then((res) => res.json())
      .then((data: LocationInfo[]) => {
        setLocations(data);
      })
      .catch((err) => {
        console.error('Fetch /api/soybean error:', err);
        setError('Failed to load location data.');
      });
  }, []);

  // ─────────── 5. currentYear 변경 시 selectedYears 덮어쓰기 (애니메이션 모드) ───────────
  useEffect(() => {
    if (isPlaying && currentYear !== null) {
      setSelectedYears([currentYear]);
    }
  }, [currentYear, isPlaying]);

  // ─────────── 6. Cesium Viewer 초기화 ───────────
  useLayoutEffect(() => {
    if (viewerInstance.current) return;
    if (!viewerRef.current) {
      setError('Viewer container not found.');
      return;
    }

    const token = process.env.NEXT_PUBLIC_CESIUM_TOKEN || '';
    if (!token) {
      setError('Cesium access token is not set.');
      return;
    }
    Ion.defaultAccessToken = token;

    const viewer = new Viewer(viewerRef.current, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
    });
    viewerInstance.current = viewer;

    let isMounted = true;

    const waitForScene = async (v: Viewer) => {
      return new Promise<any>((resolve, reject) => {
        let attempts = 0;
        const max = 50;
        const check = () => {
          if (v.scene) resolve(v.scene);
          else if (attempts >= max) reject(new Error('Scene init timeout'));
          else {
            attempts++;
            setTimeout(check, 100);
          }
        };
        check();
      });
    };

    const waitForCamera = async (s: any) => {
      return new Promise<any>((resolve, reject) => {
        let attempts = 0;
        const max = 50;
        const check = () => {
          if (s.camera) resolve(s.camera);
          else if (attempts >= max) reject(new Error('Camera init timeout'));
          else {
            attempts++;
            setTimeout(check, 100);
          }
        };
        check();
      });
    };

    (async () => {
      try {
        const scene = await waitForScene(viewer);
        if (!isMounted) return;

        try {
          await waitForCamera(scene);
        } catch {
          // camera.setView() 단계에서 재확인
        }
        if (!isMounted) return;

        const imageryProvider = await createWorldImageryAsync();
        if (scene.imageryLayers) {
          scene.imageryLayers.removeAll();
          scene.imageryLayers.addImageryProvider(imageryProvider);
        }
        if (!isMounted) return;

        if (scene.camera) {
          scene.camera.setView({
            destination: Cartesian3.fromDegrees(-156.9, 71.3647, 200000),
            orientation: {
              heading: CesiumMath.toRadians(0),
              pitch: CesiumMath.toRadians(-80),
              roll: 0.0,
            },
          });
        }
        if (!isMounted) return;

        // (A) Microbe 전용 DataSource 생성
        const mds = new CustomDataSource('microbes');
        mds.clustering.enabled = false;
        microbeDataSourceRef.current = mds;
        await viewer.dataSources?.add(mds);

        // (B) Soybean 전용 DataSource 생성
        const sds = new CustomDataSource('soybeans');
        sds.clustering.enabled = false;
        soybeanDataSourceRef.current = sds;
        await viewer.dataSources?.add(sds);

        if (!isMounted) return;
        setIsViewerInitialized(true);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Initialization error:', err);
        setError(`Failed to initialize Cesium viewer: ${err.message}`);
      }
    })();

    return () => {
      isMounted = false;
      if (viewerInstance.current) {
        try {
          viewerInstance.current.dataSources?.removeAll();
        } catch {}
        viewerInstance.current.destroy();
        viewerInstance.current = null;
        setIsViewerInitialized(false);
      }
    };
  }, []);

  // ─────────── 7. Microbe 엔티티 생성 ───────────
  const handleSelectGroup = useCallback((group: Microbe[]) => {
    setSelectedGroup(group);
  }, []);

  useLayoutEffect(() => {
    if (!isViewerInitialized) return;
    const mds = microbeDataSourceRef.current!;
    if (!mds) return;

    // (1) 기존 Microbe 엔티티만 삭제
    mds.entities.removeAll();

    // (2) Microbe 그룹핑 로직
    const grouped: Record<string, Microbe[]> = {};
    microbes.forEach((m) => {
      const passYear = selectedYears.includes(m.year!);
      const passOrganism =
        organismFilter.trim() === '' ||
        m.organism.toLowerCase().includes(organismFilter.trim().toLowerCase());
      const passSequence =
        sequenceFilter.trim() === '' ||
        (m.sequence != null &&
          m.sequence.toLowerCase().includes(sequenceFilter.trim().toLowerCase()));

      if (
        passYear &&
        passOrganism &&
        passSequence &&
        m.latitude != null &&
        m.longitude != null
      ) {
        const lat = m.latitude;
        const lon = m.longitude;
        const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(m);
      }
    });

    // (3) 그룹별로 Microbe 엔티티 추가
    Object.entries(grouped).forEach(([key, group]) => {
      const [lat, lon] = key.split(',').map(parseFloat);
      const cesiumColor = yearColorMap[group[0].year!] || Color.GRAY;

      // InfoBox 콘텐츠 조합
      const html = group
        .map((g) => {
          const seqText =
            g.sequence === null || g.sequence === undefined
              ? 'N/A'
              : g.sequence;
          const displayDate = g.collection_date
            ? g.collection_date!.split('T')[0]
            : 'N/A';

          return `
            <strong style="color:#fff380;">${g.organism}</strong><br/>
            <span style="color:#cccccc;">NCBI ID:</span> 
              <span style="color:#ffffff;">${g.ncbi_id}</span><br/>
            <span style="color:#cccccc;">Collection Date:</span> 
              <span style="color:#ffffff;">${displayDate || 'N/A'}</span><br/>
            <span style="color:#cccccc;">Year:</span> 
              <span style="color:#ffffff;">${g.year || 'Unknown'}</span><br/>
            <span style="color:#cccccc;">Sequence:</span> 
              <span style="color:#ffffff; word-break: break-all;">${seqText}</span><br/>
            <hr style="border-color: #555555;" />
          `;
        })
        .join('');

      mds.entities.add({
        position: Cartesian3.fromDegrees(lon, lat),
        point: {
          pixelSize: 10,
          color: cesiumColor,
        },
        label: {
          text:
            group.length === 1
              ? group[0].organism
              : `${group.length} microbes`,
          font: 'bold 16px sans-serif',
          fillColor: Color.WHITESMOKE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.TOP,
          pixelOffset: new Cartesian3(0, -15),
        },
        name: 'microbes',
        description: new CallbackProperty(() => {
          handleSelectGroup(group);
          return new ConstantProperty(`
            <div style="background-color: rgba(32, 34, 37, 0.95); padding: 10px; color: #ffffff; max-height: 300px; font-size: 16px;">
              ${html}
            </div>
          `);
        }, false),
      });
    });
  }, [
    microbes,
    selectedYears,
    organismFilter,
    sequenceFilter,
    yearColorMap,
    isViewerInitialized,
  ]);

  // ─────────── 8. Soybean 엔티티 생성 (SoybeanMarkers에 위임) ───────────
  // 이때 soybeanDataSourceRef.current가 “SoybeanMarkers”에 전달됩니다.
  // SoybeanMarkers 내부에서 prod-/div-/point- 엔티티를 모두 생성합니다.

  // ─────────── 9. 오염 아이콘 마커 추가(한 번만) ───────────
  useAddPollutantMarkers(viewerInstance.current, isViewerInitialized);
  

  // ─────────── 10. “prod-/div- 클릭 시 central point 선택” 로직 ───────────
  useEffect(() => {
    if (!isViewerInitialized) return;
    const viewer = viewerInstance.current!;
    const sds = soybeanDataSourceRef.current!;
    if (!viewer || !sds) return;

    // 이미 핸들러가 있다면 중복 등록을 막기 위해 return
    const existingHandler = (viewer as any)._soybeanClickHandlerRegistered;
    if (existingHandler) {
      return;
    }

    const handler = new ScreenSpaceEventHandler(viewer.canvas);
    handler.setInputAction((clickEvent: any) => {
      const picked = viewer.scene.pick(clickEvent.position);
      // 1) prod-/div- 클릭했을 때: 해당 지역만 선택
      if (picked && picked.id) {
        const clickedId = String(picked.id.id);
        if (clickedId.startsWith('prod-') || clickedId.startsWith('div-')) {
          const locationCode = clickedId.split('-')[1];
          const central = sds.entities.getById(`point-${locationCode}`);
          if (central) {
            viewer.selectedEntity = central;
            setSelectedRegion(locationCode);
          }
          return; // 이 경우만 선택 유지
        }
      }
      // 2) 그 외(배경, 마이크로브, 중앙점, 다른 UI) 클릭 시: 선택 해제
      setSelectedRegion(null);
      setSelectedGroup(null);
      setIsPieChartOpen(false);
      }, ScreenSpaceEventType.LEFT_CLICK);

    // 중복 등록 방지를 위해, viewer 인스턴스에 플래그 달기
    (viewer as any)._soybeanClickHandlerRegistered = true;
    return () => {
      handler.destroy();
      (viewer as any)._soybeanClickHandlerRegistered = false;
    };
  }, [isViewerInitialized, setSelectedRegion]);

  // ─────────── 11. 체크박스 토글 함수 ───────────
  const toggleYear = useCallback(
    (year: number) => {
      if (isPlaying) {
        setIsPlaying(false);
      }
      setSelectedYears((prev) =>
        prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
      );
    },
    [isPlaying]
  );

  // ─────────── 12. 전체 선택 토글 ───────────
  const toggleSelectAll = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    }
    if (selectedYears.length === uniqueYears.length) {
      setSelectedYears([]);
    } else {
      setSelectedYears([...uniqueYears]);
    }
  }, [isPlaying, selectedYears, uniqueYears]);

  // ─────────── 13. Play/Pause 버튼 핸들러 ───────────
  const onClickPlayPause = useCallback(() => {
    if (!isPlaying) {
      if (currentYear === null && uniqueYears.length > 0) {
        setCurrentYear(uniqueYears[0]);
        setSelectedYears([uniqueYears[0]]);
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [isPlaying, uniqueYears, currentYear]);

  // ─────────── 14. 애니메이션 setInterval 관리 ───────────
  useEffect(() => {
    if (!isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      return;
    }
    playIntervalRef.current = setInterval(() => {
      setCurrentYear((prev) => {
        if (prev === null) return uniqueYears[0];
        const idx = uniqueYears.indexOf(prev);
        if (idx < 0) return uniqueYears[0];
        if (idx === uniqueYears.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return uniqueYears[idx + 1];
      });
    }, 1000);
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [isPlaying, uniqueYears]);

  // ─────────── 15. UI 렌더링 ───────────
  const minYear = uniqueYears.length > 0 ? uniqueYears[0] : 0;
  const maxYear =
    uniqueYears.length > 0 ? uniqueYears[uniqueYears.length - 1] : 0;

  return (
    <>
      {/* 0) 에러 표시 */}
      {error && (
        <div className="absolute top-4 left-4 z-50 bg-red-500 text-white p-2 rounded shadow">
          {error}
        </div>
      )}

      {/* 1) FilterPanel */}
      <FilterPanel
        uniqueYears={uniqueYears}
        selectedYears={selectedYears}
        onToggleYear={toggleYear}
        onToggleSelectAll={toggleSelectAll}
        minYear={minYear}
        maxYear={maxYear}
        currentYear={currentYear}
        isPlaying={isPlaying}
        onPlayPause={onClickPlayPause}
        onChangeSlider={(y) => setCurrentYear(y)}
        uniqueOrganisms={uniqueOrganisms}
        organismFilter={organismFilter}
        onOrganismFilterChange={setOrganismFilter}
        sequenceFilter={sequenceFilter}
        onSequenceFilterChange={setSequenceFilter}
        isOpen={isYearPanelOpen}
        onToggleOpen={() => setIsYearPanelOpen((prev) => !prev)}
      />

      {/* 2) Cesium Viewer 컨테이너 */}
      <div
        ref={viewerRef}
        style={{
          position: 'absolute',
          top: '64px',
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'visible',
        }}
      />

      {/* 3) SoybeanMarkers 호출: Soybean 전용 데이터소스를 전달 */}
      <SoybeanMarkers
        dataSource={soybeanDataSourceRef.current}
        locations={locations}
        isViewerInitialized={isViewerInitialized}
      />

      {/* 4) PieChartPanel (selectedGroup이 있을 때만 렌더링) */}
      {selectedGroup && (
        <PieChartPanel
          data={selectedGroup}
          coords={{
            lat: selectedGroup[0].latitude!,
            lon: selectedGroup[0].longitude!
          }}
          isOpen={isPieChartOpen}
          onToggleOpen={() => setIsPieChartOpen((prev) => !prev)}
        />
      )}

      {/* 5) ViolinChartPanel: 항상 렌더, 클릭한 지역이 있으면 강조 */}
      {selectedRegion && (
        <FloatingPanel className=" 
          fixed left-0 right-0 bottom-8 
          sm:left-1/2 sm:transform sm:-translate-x-1/2
          sm:w-[480px] sm:h-[300px]
          w-full h-[28vh]
          h-auto
          z-40
          ">
          <ViolinChartPanel
            data={seedYieldData}
            selectedRegion={selectedRegion}
          />
        </FloatingPanel>
      )}
    </>
  );
}
