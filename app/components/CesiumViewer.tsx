'use client';

import { useLayoutEffect, useRef, useState } from 'react';
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
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import dynamic from 'next/dynamic';
import { Microbe } from '@/app/lib/types';

// PieChart 컴포넌트를 동적으로 import (SSR 비활성화)
const PieChart = dynamic(() => import('@/app/components/MicrobePieChart'), { ssr: false });

/**
 * Cesium 정적 리소스 경로 설정
 * - 빌드 시 `public/Cesium` 폴더 하위에 Assets/, Widgets/, ThirdParty/ 등이 있어야 함
 */
declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}
(window as Window).CESIUM_BASE_URL = '/Cesium';

export default function CesiumGlobe() {
  /** =========================================
   *  1. Refs 및 상태 변수 선언
   * ========================================= */
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<Viewer | null>(null);
  const dataSourceRef = useRef<CustomDataSource | null>(null);

  const [microbes, setMicrobes] = useState<Microbe[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isViewerInitialized, setIsViewerInitialized] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Microbe[] | null>(null);

  /** =========================================
   *  2. 마이크로브 데이터 Fetch (페이지 로드 시 한 번 실행)
   * ========================================= */
  useLayoutEffect(() => {
    fetch('/api/microbes')
      .then((res) => res.json())
      .then((data: Microbe[]) => {
        setMicrobes(data);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setError('Failed to load microbe data.');
      });
  }, []);

  /** =========================================
   *  3. uniqueYears 계산
   * ========================================= */
  const uniqueYears = Array.from(
    new Set(microbes.map((m) => m.year).filter((y): y is number => y != null))
  ).sort();

  /** =========================================
   *  4. 동적 HSL 색상 매핑 생성
   * ========================================= */
  const yearColorMap: Record<number, Color> = {};
  uniqueYears.forEach((year, index) => {
    const N = uniqueYears.length;
    const hue = (index / N) * 360;
    yearColorMap[year] = Color.fromHsl(hue / 360, 0.7, 0.5);
  });

  /** =========================================
   *  5. Cesium Viewer 초기화
   * ========================================= */
  useLayoutEffect(() => {
    if (viewerInstance.current) {
      console.log('▶ Viewer already exists, skipping initialization.');
      return;
    }
    if (!viewerRef.current) {
      setError('Viewer container not found.');
      return;
    }

    let isMounted = true;
    // ★ 여기서 환경변수를 읽어야 함 ★
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
    console.log('▶ Viewer created:', viewer);

    const waitForScene = async (viewer: Viewer): Promise<import('cesium').Scene> => {
      return new Promise((resolve, reject) => {
        const maxAttempts = 50;
        let attempts = 0;
        const checkScene = () => {
          if (viewer.scene) {
            resolve(viewer.scene);
          } else if (attempts >= maxAttempts) {
            reject(new Error('Scene initialization timed out'));
          } else {
            attempts++;
            setTimeout(checkScene, 100);
          }
        };
        checkScene();
      });
    };

    const waitForCamera = async (
      scene: import('cesium').Scene
    ): Promise<import('cesium').Camera> => {
      return new Promise((resolve, reject) => {
        const maxCamAttempts = 50;
        let camAttempts = 0;
        const checkCam = () => {
          if (scene.camera) {
            resolve(scene.camera);
          } else if (camAttempts >= maxCamAttempts) {
            reject(new Error('Camera initialization timed out'));
          } else {
            camAttempts++;
            setTimeout(checkCam, 100);
          }
        };
        checkCam();
      });
    };

    (async () => {
      try {
        const scene = await waitForScene(viewer);
        if (!isMounted) return;

        try {
          await waitForCamera(scene);
        } catch {
          // camera setView() 로 또 확인하기 때문에 무시
        }
        if (!isMounted) return;

        try {
          const imageryProvider = await createWorldImageryAsync();
          if (scene.imageryLayers) {
            scene.imageryLayers.removeAll();
            scene.imageryLayers.addImageryProvider(imageryProvider);
          }
        } catch (e) {
          console.error('▶ Failed to set base imagery:', e);
        }
        if (!isMounted) return;

        if (scene.camera) {
          scene.camera.setView({
            destination: Cartesian3.fromDegrees(0.0, 80.0, 9000000),
            orientation: {
              heading: CesiumMath.toRadians(0.0),
              pitch: CesiumMath.toRadians(-90.0),
              roll: 0.0,
            },
          });
        }
        if (!isMounted) return;

        const dataSource = new CustomDataSource('microbes');
        dataSource.clustering.enabled = false;
        dataSourceRef.current = dataSource;
        if (viewer.dataSources) {
          try {
            await viewer.dataSources.add(dataSource);
          } catch (e) {
            console.error('▶ Failed to add DataSource:', e);
          }
        }
        if (!isMounted) return;

        // ─────────────────────────────────────────────────────────────
        // STEP 6: InfoBox iframe 내부 스크롤 스타일 주입
        // ─────────────────────────────────────────────────────────────
        if (viewer.infoBox && viewer.infoBox.frame) {
          viewer.infoBox.frame.addEventListener('load', () => {
            const iframeDoc = viewer.infoBox.frame?.contentDocument;
            if (iframeDoc && iframeDoc.readyState === 'complete') {
              const descDiv = iframeDoc.querySelector('.cesium-infoBox-description') as HTMLDivElement;
              if (descDiv) {
                descDiv.setAttribute(
                  'style',
                  `
                    max-height: 240px;
                    overflow-y: auto;
                    font-size: 16px;
                    line-height: 1.5;
                    padding: 6px;
                    box-sizing: border-box;
                    color: #ffffff;
                  `
                );
              }
            }
          });
        }
        if (!isMounted) return;

        setIsViewerInitialized(true);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('▶ Initialization error:', err);
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

  /** =========================================
   *  6. 마이크로브 데이터 표시: Entity 생성
   * ========================================= */
  useLayoutEffect(() => {
    const viewer = viewerInstance.current;
    
    viewer?.selectedEntityChanged.addEventListener(() => {
      if(!viewer.selectedEntity) {
        setSelectedGroup(null);
      }
    });

    const dataSource = dataSourceRef.current;
    if (!isViewerInitialized || !viewer || !dataSource || microbes.length === 0) {
      return;
    }

    dataSource.entities?.removeAll();
    const grouped: Record<string, Microbe[]> = {};

    microbes.forEach((m) => {
      if (
        selectedYears.includes(m.year!) &&
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

    Object.entries(grouped).forEach(([key, group]) => {
      const [lat, lon] = key.split(',').map(parseFloat);
      const cesiumColor = yearColorMap[group[0].year!] || Color.GRAY;
      const html = group
        .map(
          (g) => `
            <strong style="color:#ffffff;">${g.organism}</strong><br/>
            <span style="color:#cccccc;">NCBI ID:</span> <span style="color:#ffffff;">${g.ncbi_id}</span><br/>
            <span style="color:#cccccc;">Collection Date:</span> <span style="color:#ffffff;">${g.collection_date ||
            'N/A'}</span><br/>
            <span style="color:#cccccc;">Year:</span> <span style="color:#ffffff;">${g.year || 'Unknown'}</span><br/>
            <hr style="border-color: #555555;" />
          `
        )
        .join('');

      dataSource.entities.add({
        position: Cartesian3.fromDegrees(lon, lat),
        point: {
          pixelSize: 10,
          color: cesiumColor,
        },
        label: {
          text: group.length === 1 ? group[0].organism : `${group.length} microbes`,
          font: 'bold 16px sans-serif',
          fillColor: Color.WHITESMOKE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.TOP,
          pixelOffset: new Cartesian3(0, -15),
        },
        description: new CallbackProperty(() => {
          setSelectedGroup(group);
          return new ConstantProperty(
            `<div style="background-color: rgba(32, 34, 37, 0.95); padding: 10px; color: #ffffff; max-height: 300px; font-size: 16px;">
              ${html}
            </div>`
          );
        }, false),
      });
    });
  }, [microbes, selectedYears, isViewerInitialized]);

  /** =========================================
   *  7. 연도 체크박스 토글 함수
   * ========================================= */
  const toggleYear = (year: number) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const toggleSelectAll = () => {
    if (selectedYears.length === uniqueYears.length) {
      setSelectedYears([]);
    } else {
      setSelectedYears([...uniqueYears]);
    }
  };

  return (
    <>
      {/* =======================================
          에러 표시 (초기화나 Fetch 에러 발생 시)
         ======================================= */}
      {error && (
        <div className="absolute top-4 left-4 z-10 bg-red-500 text-white p-2 rounded shadow">
          {error}
        </div>
      )}

      {/* =======================================
          왼쪽 패널: 반투명 블러 카드 스타일
         ======================================= */}
      <div className="fixed top-20 left-4 z-30 w-40 max-h-[80vh] overflow-y-auto bg-white/10 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg p-4">
        <h2 className="text-sm font-semibold mb-2 text-white">🗓️ Filter by Year</h2>
        <div className="mb-3">
          <label className="flex items-center space-x-2 text-sm text-white hover:bg-white/10 rounded-md px-2 py-1">
            <input
              type="checkbox"
              // uniqueYears 배열 길이와 selectedYears 길이를 비교하여 모두 선택됐을 때 체크
              checked={selectedYears.length === uniqueYears.length}
              onChange={toggleSelectAll}
              className="accent-lime-400 focus:ring-2 focus:ring-lime-300"
            />
            <span>전체 선택</span>
          </label>
        </div>
        
        <div className="space-y-1 px-1">
          {uniqueYears.map((year) => {
            const cesiumColor = yearColorMap[year] || Color.GRAY;
            const cssHex = cesiumColor.toCssHexString();

            return (
              <label
                key={year}
                className="flex items-center space-x-2 text-sm text-white hover:bg-white/10 rounded-md"
              >
                <input
                  type="checkbox"
                  value={year}
                  checked={selectedYears.includes(year)}
                  onChange={() => toggleYear(year)}
                  className="accent-lime-400 focus:ring-2 focus:ring-lime-300"
                />
                <span
                  style={{
                    backgroundColor: cssHex,
                    width: '12px',
                    height: '12px',
                    borderRadius: '2px',
                    display: 'inline-block',
                  }}
                />
                <span>{year}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* =======================================
          Cesium이 렌더될 DIV (헤더 높이만큼 아래로 내려서 설정)
         ======================================= */}
      <div
        ref={viewerRef}
        style={{
          position: 'absolute',       // 절대 위치
          top: '64px',                // <-- 헤더가 차지하는 높이만큼 내려줍니다.
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'visible',        // InfoBox 내부 스크롤바가 잘리지 않게 보장
        }}
      />

      {/* =======================================
          오른쪽 하단: 선택된 그룹이 있을 때 PieChart 표시
         ======================================= */}
      {selectedGroup && (
        <div className="fixed bottom-10 left-4 z-30 w-[450px] max-h-[60vh] overflow-y-auto bg-white/10 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg p-4">
          <h3 className="font-semibold text-white text-sm mb-2">
            📊 Organism Distribution
          </h3>
          <PieChart data={selectedGroup} />
        </div>
      )}
    </>
  );
}
