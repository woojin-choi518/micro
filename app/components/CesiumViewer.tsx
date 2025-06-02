'use client';

import { useLayoutEffect, useRef, useState, useEffect } from 'react';
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

// Cesium 정적 리소스 경로 설정 (public/Cesium 아래에 리소스가 있어야 함)
declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}
(window as Window).CESIUM_BASE_URL = '/Cesium';

export default function CesiumGlobe() {
  /** ================================================================
   *  1. Refs 및 상태 변수 선언
   *  ================================================================ */
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<Viewer | null>(null);
  const dataSourceRef = useRef<CustomDataSource | null>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [microbes, setMicrobes] = useState<Microbe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isViewerInitialized, setIsViewerInitialized] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Microbe[] | null>(null);

  // — 체크박스로 다중 연도 선택
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  // — 슬라이더 애니메이션 관련 상태
  const [uniqueYears, setUniqueYears] = useState<number[]>([]);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // — organism/sequence 필터
  const [organismFilter, setOrganismFilter] = useState<string>('');
  const [sequenceFilter, setSequenceFilter] = useState<string>('');

  // — 드롭다운에 들어갈 고유 organism 목록
  const uniqueOrganisms = Array.from(
    new Set(microbes.map((m) => m.organism).filter((o) => o != null))
  ).sort();

  /** ================================================================
   *  2. uniqueYears → yearColorMap 생성
   *     microbes가 바뀔 때마다 uniqueYears를 업데이트하고, 색상 매핑도 갱신
   *  ================================================================ */
  // 2-1) uniqueYears 계산
  useEffect(() => {
    const years = Array.from(
      new Set(microbes.map((m) => m.year).filter((y): y is number => y != null))
    ).sort();
    setUniqueYears(years);

    // 최초 한 번: currentYear가 null이면 가장 빠른 연도로 초기화
    if (years.length > 0 && currentYear === null) {
      setCurrentYear(years[0]);
      setSelectedYears([years[0]]);
    }
  }, [microbes]);

  // 2-2) yearColorMap 생성 (render 때마다 재생성해도 무방합니다)
  const yearColorMap: Record<number, Color> = {};
  uniqueYears.forEach((year, index) => {
    const N = uniqueYears.length;
    const hue = (index / N) * 360;
    yearColorMap[year] = Color.fromHsl(hue / 360, 0.7, 0.5);
  });

  /** ================================================================
   *  3. 마이크로브 데이터 Fetch (페이지 로드 시 한 번 실행)
   *  ================================================================ */
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

  /** ================================================================
   *  4. currentYear 변경 시 → isPlaying 모드라면 selectedYears 덮어쓰기
   *  ================================================================ */
  useEffect(() => {
    if (isPlaying && currentYear !== null) {
      setSelectedYears([currentYear]);
    }
  }, [currentYear, isPlaying]);

  /** ================================================================
   *  5. Cesium Viewer 초기화 (한 번만)
   *  ================================================================ */
  useLayoutEffect(() => {
    if (viewerInstance.current) {
      // 이미 초기화했다면 스킵
      return;
    }
    if (!viewerRef.current) {
      setError('Viewer container not found.');
      return;
    }

    // Cesium Token 읽기(환경변수 NEXT_PUBLIC_CESIUM_TOKEN 설정 필요)
    const token = process.env.NEXT_PUBLIC_CESIUM_TOKEN || '';
    if (!token) {
      setError('Cesium access token is not set.');
      return;
    }
    Ion.defaultAccessToken = token;

    // Viewer 생성
    const viewer = new Viewer(viewerRef.current, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
    });
    viewerInstance.current = viewer;

    // Scene/Camera 준비 헬퍼
    const waitForScene = async (viewer: Viewer): Promise<import('cesium').Scene> => {
      return new Promise((resolve, reject) => {
        const maxAttempts = 50;
        let attempts = 0;
        const checkScene = () => {
          if (viewer.scene) resolve(viewer.scene);
          else if (attempts >= maxAttempts) reject(new Error('Scene init timeout'));
          else {
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
          if (scene.camera) resolve(scene.camera);
          else if (camAttempts >= maxCamAttempts) reject(new Error('Camera init timeout'));
          else {
            camAttempts++;
            setTimeout(checkCam, 100);
          }
        };
        checkCam();
      });
    };

    let isMounted = true;
    (async () => {
      try {
        // STEP1: Scene 준비
        const scene = await waitForScene(viewer);
        if (!isMounted) return;

        // STEP2: Camera 준비
        try {
          await waitForCamera(scene);
        } catch {
          // camera.setView() 호출 시 다시 확인 예정이므로 무시
        }
        if (!isMounted) return;

        // STEP3: 베이스 레이어 교체
        const imageryProvider = await createWorldImageryAsync();
        if (scene.imageryLayers) {
          scene.imageryLayers.removeAll();
          scene.imageryLayers.addImageryProvider(imageryProvider);
        }
        if (!isMounted) return;

        // STEP4: 카메라 북극 뷰로 셋업
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

        // STEP5: CustomDataSource 생성하여 뷰어에 추가
        const dataSource = new CustomDataSource('microbes');
        dataSource.clustering.enabled = false;
        dataSourceRef.current = dataSource;
        if (viewer.dataSources) {
          await viewer.dataSources.add(dataSource);
        }
        if (!isMounted) return;

        // STEP6: InfoBox 스크롤 스타일 주입
        if (viewer.infoBox && viewer.infoBox.frame) {
          viewer.infoBox.frame.addEventListener('load', () => {
            const iframeDoc = viewer.infoBox.frame?.contentDocument;
            if (iframeDoc && iframeDoc.readyState === 'complete') {
              const descDiv = iframeDoc.querySelector(
                '.cesium-infoBox-description'
              ) as HTMLDivElement;
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

  /** ================================================================
   *  6. 마이크로브 데이터 표시: Entity 생성
   *     → selectedYears, organismFilter, sequenceFilter 변경 시 재실행
   *  ================================================================ */
  useLayoutEffect(() => {
    const viewer = viewerInstance.current;
    const dataSource = dataSourceRef.current;
    if (!isViewerInitialized || !viewer || !dataSource) return;

    // “엔티티 선택 해제 시 PieChart 닫기” 로직
    viewer.selectedEntityChanged.addEventListener(() => {
      if (!viewer.selectedEntity) {
        setSelectedGroup(null);
      }
    });

    // 1) 기존 엔티티 모두 삭제
    dataSource.entities.removeAll();

    // 2) 각 마이크로브를 위도/경도 소수점 5자리로 그룹핑
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

      if (passYear && passOrganism && passSequence && m.latitude != null && m.longitude != null) {
        const lat = m.latitude;
        const lon = m.longitude;
        const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(m);
      }
    });

    // 3) 그룹별로 Entity 추가
    Object.entries(grouped).forEach(([key, group]) => {
      const [lat, lon] = key.split(',').map(parseFloat);
      const cesiumColor = yearColorMap[group[0].year!] || Color.GRAY;

      // InfoBox에 들어갈 HTML 조합
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
  }, [microbes, selectedYears, isViewerInitialized, organismFilter, sequenceFilter]);

  /** ================================================================
   *  7. “오염 아이콘” 추가 (Offshore/Nearshore)
   *  ================================================================ */
// … (생략: 상단 import 및 상태 선언 부분은 기존과 동일합니다) …

  /** ================================================================
   *  7-1. 오염 아이콘(마커) 4개 추가: Offshore, Nearshore, Nunavut, Northwest Passage
   *     → 뷰어가 완전히 초기화된 이후(isViewerInitialized === true) 한 번만 실행
   *  ================================================================ */
  useLayoutEffect(() => {
    const viewer = viewerInstance.current;
    if (!isViewerInitialized || !viewer) return;

    // --- (1) 기존에 동일 ID로 추가된 엔티티가 있으면 제거 ---
    const existingIds = [
      'pollution-offshore',
      'pollution-nearshore',
      'pollution-nunavut',
      'pollution-northwest'
    ];
    existingIds.forEach((id) => {
      if (viewer.entities.getById(id)) {
        viewer.entities.removeById(id);
      }
    });

    // --- (2) Offshore 아이콘 추가 ---
    viewer.entities.add({
      id: 'pollution-offshore',
      position: Cartesian3.fromDegrees(-162.2668, 71.1050), // Burger oil lease, 약 90 km from Wainwright, Alaska
      billboard: {
        image: 'images/warning-icon.svg',   // public/warning-icon.svg
        width: 32,
        height: 32,
        verticalOrigin: VerticalOrigin.CENTER,
      },
      name: 'Offshore Pollution Experiment',
      description: new ConstantProperty(`
        <div style="
          background-color: rgba(32, 34, 37, 0.95);
          padding: 12px;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.4;
          max-width: 300px;
        ">
          <h3 style="margin-top:0; color:#ffcc00;">원해(Offshore) 지역</h3>
          <p><strong>위치:</strong> 71.1050° N, –162.2668° W (약 90 km from Wainwright, Alaska)</p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 배경</h4>
          <p style="margin:0 0 8px 0;">
            알래스카 북극 먼바다 지역에는 극한 환경에서도 기름과 화학물질을 분해하는 미생물이 존재합니다. 
            이 미생물들이 실제로 얼마나 빠르게 오염 물질을 분해하는지 평가했습니다.
          </p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 결과 (28일)</h4>
          <ul style="margin:0; padding-left:1em;">
            <li><strong>석유(원유)</strong> 분해율: <strong>41%</strong></li>
            <li><strong>Corexit 9500 주요 성분(DOSS)</strong> 분해율: <strong>77%</strong></li>
            <li>다른 성분(Span 80, Tween 80, Tween 85)은 대부분 분해되거나 자연 소실</li>
          </ul>
          <h4 style="margin-bottom:4px; color:#ffcc00;">주요 미생물 그룹</h4>
          <p style="margin:0;">
            <em>Oleispira</em>, <em>Polaribacter</em>, <em>Colwellia</em>
          </p>
        </div>
      `),
    });

    // --- (3) Nearshore 아이콘 추가 ---
    viewer.entities.add({
      id: 'pollution-nearshore',
      position: Cartesian3.fromDegrees(-156.5241, 71.3647), // Utqiagvik(Barrow)에서 약 1 km 거리
      billboard: {
        image: 'images/warning-icon.svg',
        width: 32,
        height: 32,
        verticalOrigin: VerticalOrigin.CENTER,
      },
      name: 'Nearshore Pollution Experiment',
      description: new ConstantProperty(`
        <div style="
          background-color: rgba(32, 34, 37, 0.95);
          padding: 12px;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.4;
          max-width: 300px;
        ">
          <h3 style="margin-top:0; color:#ffcc00;">근해(Near‐shore) 지역</h3>
          <p><strong>위치:</strong> 71.3647° N, –156.5241° W (약 1 km from Utqiagvik/Barrow, Alaska)</p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 배경</h4>
          <p style="margin:0 0 8px 0;">
            알래스카 북극 연안의 바닷물에는 기름과 화학물질을 분해하는 미생물이 있습니다. 
            연구팀은 이 미생물들이 얼마나 효과적으로 오염을 분해할 수 있는지 실험했습니다.
          </p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 방법</h4>
          <p style="margin:0 0 8px 0;">
            바닷물을 실험실로 가져와 인공적으로 석유와 Corexit 9500을 넣고 28일 동안 분해 능력 관찰
          </p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 결과 (28일)</h4>
          <ul style="margin:0; padding-left:1em;">
            <li><strong>석유(원유)</strong> 분해율: <strong>36%</strong></li>
            <li><strong>Corexit 9500 주요 성분(DOSS)</strong> 분해율: <strong>33%</strong></li>
            <li>다른 성분(Span 80, Tween 80, Tween 85)은 거의 모두 분해되거나 자연 소실</li>
          </ul>
          <h4 style="margin-bottom:4px; color:#ffcc00;">주요 미생물 그룹</h4>
          <p style="margin:0;">
            <em>Oleispira</em>, <em>Polaribacter</em>, <em>Colwellia</em>
          </p>
        </div>
      `),
    });

    // --- (4) Nunavut (얼음 아래 바닷물) 아이콘 추가 ---
    viewer.entities.add({
      id: 'pollution-nunavut',
      position: Cartesian3.fromDegrees(-94.8297, 74.6773), // Resolute Bay, Nunavut: 74.6773° N, -94.8297° W
      billboard: {
        image: 'images/warning-icon.svg',
        width: 32,
        height: 32,
        verticalOrigin: VerticalOrigin.CENTER,
      },
      name: 'Nunavut Under‐Ice Seawater Study',
      description: new ConstantProperty(`
        <div style="
          background-color: rgba(32, 34, 37, 0.95);
          padding: 12px;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.4;
          max-width: 300px;
        ">
          <h3 style="margin-top:0; color:#ffcc00;">누나부트(Nunavut) 지역</h3>
          <p><strong>위치:</strong> 74.6773° N, –94.8297° W (Resolute Bay, Nunavut)</p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 배경</h4>
          <p style="margin:0 0 8px 0;">
            캐나다 북극 누나부트 지역의 얼음 아래 바닷물에는 
            자연적으로 기름을 분해하는 미생물이 서식하고 있습니다. 
            연구팀은 인공 기름 오염을 재현하여 15일간 분해 능력을 관찰했습니다.
          </p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 결과 (15일)</h4>
          <ul style="margin:0; padding-left:1em;">
            <li>얼음 아래 바닷물 속 미생물은 15일 만에 <strong>94%</strong>의 원유 분해</li>
          </ul>
          <h4 style="margin-bottom:4px; color:#ffcc00;">주요 미생물 그룹</h4>
          <ul style="margin:0; padding-left:1em;">
            <li><em>Colwellia</em>: 극저온에서도 뛰어난 기름 분해 능력</li>
            <li><em>Moritella</em>: 원유 오염 상황에서 빠르게 증식하여 기여</li>
          </ul>
        </div>
      `),
    });

    // --- (5) Northwest Passage (해빙 속) 아이콘 추가 ---
    viewer.entities.add({
      id: 'pollution-northwest',
      position: Cartesian3.fromDegrees(-127.5333, 70.6000), // Northwest Passage: 약 70.6000° N, -127.5333° W
      billboard: {
        image: 'images/warning-icon.svg',
        width: 32,
        height: 32,
        verticalOrigin: VerticalOrigin.CENTER,
      },
      name: 'Northwest Passage Ice Study',
      description: new ConstantProperty(`
        <div style="
          background-color: rgba(32, 34, 37, 0.95);
          padding: 12px;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.4;
          max-width: 300px;
        ">
          <h3 style="margin-top:0; color:#ffcc00;">노스웨스트 패시지(Northwest Passage) 지역</h3>
          <p><strong>위치:</strong> 70.6000° N, –127.5333° W (Northwest Passage, 캐나다 북극)</p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 배경</h4>
          <p style="margin:0 0 8px 0;">
            캐나다 북극 노스웨스트 패시지 지역의 두꺼운 얼음 속에도 
            기름을 분해할 수 있는 미생물이 존재합니다. 
            얼음을 실험실로 가져와 15일간 분해 능력을 관찰했습니다.
          </p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 결과 (15일)</h4>
          <ul style="margin:0; padding-left:1em;">
            <li>얼음 속 미생물은 15일 만에 <strong>48%</strong>의 원유 분해</li>
          </ul>
          <h4 style="margin-bottom:4px; color:#ffcc00;">주요 미생물 그룹</h4>
          <ul style="margin:0; padding-left:1em;">
            <li><em>Polaribacter</em>: 얼음 속에서 주로 발견되어 기름 분해</li>
          </ul>
        </div>
      `),
    });

    // (끝) 이 훅이 다시 실행되지 않도록, 의존성 배열에 isViewerInitialized만 추가
  }, [isViewerInitialized]);


  /** ================================================================
   *  8. 체크박스 토글 함수 (연도 멀티셀렉트)
   *  ================================================================ */
  const toggleYear = (year: number) => {
    // 애니메이션 모드가 켜져 있다면 해제
    if (isPlaying) {
      setIsPlaying(false);
    }
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  /** ================================================================
   *  9. 전체 선택 토글
   *  ================================================================ */
  const toggleSelectAll = () => {
    if (isPlaying) {
      setIsPlaying(false);
    }
    if (selectedYears.length === uniqueYears.length) {
      setSelectedYears([]);
    } else {
      setSelectedYears([...uniqueYears]);
    }
  };

  /** ================================================================
   * 10. Play/Pause 버튼 핸들러
   *  ================================================================ */
  const onClickPlayPause = () => {
    if (!isPlaying) {
      // ▶ 애니메이션 시작
      setIsPlaying(true);
      if (currentYear === null && uniqueYears.length > 0) {
        setCurrentYear(uniqueYears[0]);
        setSelectedYears([uniqueYears[0]]);
      }
    } else {
      // ▶ 애니메이션 일시정지
      setIsPlaying(false);
    }
  };

  /** ================================================================
   * 11. “애니메이션 재생”을 위한 setInterval 관리
   *     isPlaying:true 일 때만 타이머 생성, 종료 시 해제
   *  ================================================================ */
  useEffect(() => {
    // 애니메이션 모드가 꺼져 있다면, 타이머가 남아있으면 해제
    if (!isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      return;
    }

    // isPlaying === true → 새 타이머 생성
    playIntervalRef.current = setInterval(() => {
      setCurrentYear((prev) => {
        if (prev === null) {
          return uniqueYears[0];
        }
        const idx = uniqueYears.indexOf(prev);
        if (idx < 0) {
          return uniqueYears[0];
        }
        // 마지막 연도에 도달했으면 재생 종료
        if (idx === uniqueYears.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        // 그 외에는 다음 연도
        return uniqueYears[idx + 1];
      });
    }, 1000);

    // cleanup: effect가 재실행되거나 언마운트될 때 타이머 해제
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [isPlaying, uniqueYears]);

  /** ================================================================
   * 12. UI 렌더링
   *  ================================================================ */
  // 슬라이더의 최소/최대값
  const minYear = uniqueYears.length > 0 ? uniqueYears[0] : 0;
  const maxYear = uniqueYears.length > 0 ? uniqueYears[uniqueYears.length - 1] : 0;

  return (
    <>
      {/* — 에러 표시 — */}
      {error && (
        <div className="absolute top-4 left-4 z-10 bg-red-500 text-white p-2 rounded shadow">
          {error}
        </div>
      )}

      {/* — 왼쪽 패널: 애니메이션 슬라이더 + 필터 UI — */}
      <div className="fixed top-20 left-4 z-40 w-60 max-h-[90vh] overflow-y-auto bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg p-4 space-y-6">
        {/* ▷ 1) Year Animation (슬라이더 + Play/Pause) */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-2">🌡️ Year Animation</h2>
          <div className="flex items-center space-x-2">
            <span className="text-white text-xs">{minYear}</span>
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={currentYear ?? minYear}
              onChange={(e) => {
                const y = Number(e.target.value);
                setCurrentYear(y);
                // isPlaying === true라면 useEffect에서 selectedYears 덮어쓰기
              }}
              className="w-full"
            />
            <span className="text-white text-xs">{maxYear}</span>
          </div>
          <button
            onClick={onClickPlayPause}
            className={`mt-2 px-3 py-1 text-sm font-medium rounded 
              ${isPlaying ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
          >
            {isPlaying ? 'Pause ⏸️' : 'Play ▶️'}
          </button>
        </div>

        {/* ▷ 2) Organism 드롭다운 + 검색 */}
        <div>
          <label className="block text-white text-xs mb-1">🦠 Organism 선택</label>
          <select
            value={organismFilter}
            onChange={(e) => setOrganismFilter(e.target.value)}
            className="w-full p-1 text-gray-800 rounded-md text-sm"
          >
            <option value="">── 전체 ──</option>
            {uniqueOrganisms.map((org) => (
              <option key={org} value={org}>
                {org}
              </option>
            ))}
          </select>
          <label className="block text-white text-xs mt-3 mb-1">🔎 Organism 검색</label>
          <input
            type="text"
            placeholder="Enter organism name..."
            value={organismFilter}
            onChange={(e) => setOrganismFilter(e.target.value)}
            className="w-full p-1 text-gray-800 rounded-md text-sm"
          />
        </div>

        {/* ▷ 3) Sequence 검색 */}
        <div>
          <label className="block text-white text-xs mb-1">🔎 Sequence 검색</label>
          <input
            type="text"
            placeholder="Enter sequence substring..."
            value={sequenceFilter}
            onChange={(e) => setSequenceFilter(e.target.value)}
            className="w-full p-1 text-gray-800 rounded-md text-sm"
          />
        </div>

        {/* ▷ 4) Filter by Year (체크박스 멀티셀렉트) */}
        <div>
          <h2 className="text-sm font-semibold mb-2 text-white">📅 Filter by Year</h2>
          <div className="mb-2">
            <label className="flex items-center space-x-2 text-white text-sm hover:bg-white/10 rounded-md px-2 py-1">
              <input
                type="checkbox"
                checked={selectedYears.length === uniqueYears.length}
                onChange={toggleSelectAll}
                className="accent-lime-400 focus:ring-2 focus:ring-lime-300"
              />
              <span>전체 선택</span>
            </label>
          </div>
          <div className="space-y-1 max-h-52 overflow-y-auto px-1">
            {uniqueYears.map((year) => {
              const cesiumColor = yearColorMap[year] || Color.GRAY;
              const cssHex = cesiumColor.toCssHexString();
              return (
                <label
                  key={year}
                  className="flex items-center space-x-2 text-sm text-white hover:bg-white/10 rounded-md px-2 py-1"
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
      </div>

      {/* — Cesium이 렌더될 DIV (헤더 높이만큼 아래로 내려줍니다) — */}
      <div
        ref={viewerRef}
        style={{
          position: 'absolute',
          top: '64px', // 헤더 높이만큼 내려줍니다
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'visible', // InfoBox 내부 스크롤이 잘리지 않도록
        }}
      />

      {/* — 오른쪽 하단: 선택된 그룹이 있을 때 PieChart 표시 — */}
      {selectedGroup && (
        <div className="fixed bottom-10 left-64 z-30 w-[400px] max-h-[60vh] overflow-y-auto bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg p-4">
          <h3 className="font-semibold text-white text-sm mb-2">
            📊 Organism Distribution
          </h3>
          <PieChart data={selectedGroup} />
        </div>
      )}
    </>
  );
}
