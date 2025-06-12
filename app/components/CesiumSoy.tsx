'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  Ion,
  Viewer,
  createWorldImageryAsync,
  CustomDataSource,
  Rectangle,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

import { LocationInfo } from '@/app/lib/types';
import SoybeanMarkers from './SoybeanMarker';
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

export default function CesiumSoy() {
  // ─────────── 1. Refs & State 선언 ───────────
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<Viewer | null>(null);
  const soybeanDataSourceRef = useRef<CustomDataSource | null>(null);

  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isViewerInitialized, setIsViewerInitialized] = useState(false);

  // ─────────── 2. Soybean(LocationInfo) 데이터 Fetch ───────────
  useEffect(() => {
    fetch('/api/soybean')
      .then((res) => res.json())
      .then((data: LocationInfo[]) => setLocations(data))
      .catch((err) => {
        console.error('Fetch /api/soybean error:', err);
        setError('Failed to load location data.');
      });
  }, []);

  // ─────────── 3. Cesium Viewer 초기화 ───────────
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
    // scene / camera 준비 대기 helper
    const waitFor = <T,>(fn: () => T | undefined): Promise<T> =>
      new Promise((resolve, reject) => {
        let tries = 0;
        const tick = () => {
          const val = fn();
          if (val) return resolve(val);
          if (++tries > 50) return reject(new Error('Cesium init timeout'));
          setTimeout(tick, 100);
        };
        tick();
      });

    (async () => {
      try {
        await waitFor(() => viewer.scene);
        await waitFor(() => viewer.scene.camera);

        // (1) 베이스맵 교체
        const imagery = await createWorldImageryAsync();
        viewer.scene.imageryLayers.removeAll();
        viewer.scene.imageryLayers.addImageryProvider(imagery);

        // (2) 2D 모드 전환
        viewer.scene.morphTo2D(0);

        // (3) 중국 전체 범위로 카메라 세팅
        const chinaRect = Rectangle.fromDegrees(73, 18, 135, 54);
        viewer.camera.setView({ destination: chinaRect });

        // (4) Soybean 전용 DataSource 생성 & 추가
        const sds = new CustomDataSource('soybeans');
        sds.clustering.enabled = false;
        soybeanDataSourceRef.current = sds;
        await viewer.dataSources.add(sds);

        if (!isMounted) return;
        setIsViewerInitialized(true);
      } catch (e: any) {
        if (!isMounted) return;
        console.error('Initialization error:', e);
        setError(`Failed to initialize Cesium viewer: ${e.message}`);
      }
    })();

    return () => {
      isMounted = false;
      if (viewerInstance.current) {
        viewerInstance.current.dataSources?.removeAll();
        viewerInstance.current.destroy();
        viewerInstance.current = null;
        setIsViewerInitialized(false);
      }
    };
  }, []);

  // ─────────── 4. prod-/div- 클릭→ 중앙점 선택 로직 ───────────
  useEffect(() => {
    if (!isViewerInitialized) return;
    const viewer = viewerInstance.current!;
    const sds = soybeanDataSourceRef.current!;
    // 중복 핸들러 방지
    if ((viewer as any)._soybeanHandler) return;

    const handler = new ScreenSpaceEventHandler(viewer.canvas);
    handler.setInputAction((evt: any) => {
      const pick = viewer.scene.pick(evt.position);
      if (pick?.id && typeof pick.id.id === 'string') {
        const id = pick.id.id as string;
        if (/^(prod|div)-/.test(id)) {
          const code = id.split('-')[1];
          const center = sds.entities.getById(`point-${code}`);
          if (center) {
            viewer.selectedEntity = center;
            setSelectedRegion(code);
          }
          return;
        }
      }
      // 그 외 클릭 시 언선택
      setSelectedRegion(null);
    }, ScreenSpaceEventType.LEFT_CLICK);

    (viewer as any)._soybeanHandler = handler;
    return () => {
      handler.destroy();
      delete (viewer as any)._soybeanHandler;
    };
  }, [isViewerInitialized]);

  return (
    <>
      {error && (
        <div className="absolute top-4 left-4 z-50 bg-red-500 text-white p-2 rounded shadow">
          {error}
        </div>
      )}
      <div
        ref={viewerRef}
        style={{
          position: 'absolute',
          top: '64px',
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <SoybeanMarkers
        dataSource={soybeanDataSourceRef.current}
        locations={locations}
        isViewerInitialized={isViewerInitialized}
      />
      {selectedRegion && (
        <FloatingPanel className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-40 w-[480px] h-[300px]">
          <ViolinChartPanel data={seedYieldData} selectedRegion={selectedRegion} />
        </FloatingPanel>
      )}
    </>
  );
}
