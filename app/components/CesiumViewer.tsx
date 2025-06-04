'use client';

import { useLayoutEffect, useRef, useState, useEffect, useCallback, useMemo } from 'react';
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

import { Microbe } from '@/app/lib/types';
import FilterPanel from './FilterPanel';
import PieChartPanel from './PieChartPanel';
import { useAddPollutantMarkers } from './PollutantMarkers';

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
   const dataSourceRef = useRef<CustomDataSource | null>(null);
   const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
 
   const [microbes, setMicrobes] = useState<Microbe[]>([]);
   const [error, setError] = useState<string | null>(null);
   const [isViewerInitialized, setIsViewerInitialized] = useState(false);
   const [selectedGroup, setSelectedGroup] = useState<Microbe[] | null>(null);
 
   // 연도 필터(체크박스) & 애니메이션
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
 
   // ─────────── 3. 마이크로브 데이터 Fetch ───────────
   useLayoutEffect(() => {
     fetch('/api/microbes')
       .then((res) => res.json())
       .then((data: Microbe[]) => setMicrobes(data))
       .catch((err) => {
         console.error('Fetch error:', err);
         setError('Failed to load microbe data.');
       });
   }, []);
 
   // ─────────── 4. currentYear 변경 시 selectedYears 덮어쓰기 (애니메이션 모드) ───────────
   useEffect(() => {
     if (isPlaying && currentYear !== null) {
       setSelectedYears([currentYear]);
     }
   }, [currentYear, isPlaying]);
 
   // ─────────── 5. Cesium Viewer 초기화 ───────────
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
     const waitForScene = async (v: Viewer): Promise<import('cesium').Scene> => {
       return new Promise((resolve, reject) => {
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
     const waitForCamera = async (
       s: import('cesium').Scene
     ): Promise<import('cesium').Camera> => {
       return new Promise((resolve, reject) => {
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
 
         const dataSource = new CustomDataSource('microbes');
         dataSource.clustering.enabled = false;
         dataSourceRef.current = dataSource;
         await viewer.dataSources?.add(dataSource);
         if (!isMounted) return;
 
         if (viewer.infoBox?.frame) {
          viewer.infoBox.frame.addEventListener('load', () => {
            // 1) iframe 문서 객체 얻어오기
            const iframeDoc = viewer.infoBox.frame!.contentDocument;
            if (!iframeDoc || iframeDoc.readyState !== 'complete') {
              return; 
            }
          
            // 2) <head> 내부에 override용 <style> 삽입하기
            //    모든 요소에 user-select: text !important 를 걸어주면
            //    Cesium이 기본으로 걸어둔 "user-select:none"을 덮어쓸 수 있습니다.
            const styleEl = iframeDoc.createElement('style');
            styleEl.innerHTML = `
              /* InfoBox 내부의 모든 요소를 선택 가능하도록 강제 */
              .cesium-infoBox-description,
              .cesium-infoBox-description * {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
              }
            `;
            // <head>가 있다면 넣어주고, 없으면 <html> 끝에 추가
            const headEl = iframeDoc.head || iframeDoc.getElementsByTagName('head')[0];
            if (headEl) {
              headEl.appendChild(styleEl);
            } else {
              iframeDoc.documentElement.appendChild(styleEl);
            }
          
            // 3) .cesium-infoBox-description 요소 찾아서 불필요한 unselectable 속성 제거 + 필요한 스타일 다시 적용
            const descDiv = iframeDoc.querySelector('.cesium-infoBox-description') as HTMLDivElement | null;
            if (descDiv) {
              // (a) unselectable="on" 속성이 있으면 제거합니다.
              if (descDiv.hasAttribute('unselectable')) {
                descDiv.removeAttribute('unselectable');
              }
              // (b) 패딩, 스크롤, 컬러 등 필요한 기존 스타일을 적용하되,
              //     user-select은 위의 <style>로 처리했으므로 따로 명시하지 않아도 됩니다.
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
                  /* user-select은 위의 <style>에서 처리되므로, 여기서는 넣지 않아도 됨 */
                `
              );
          
              // (c) 자식 요소들에도 혹시 unselectable 속성이 걸려 있을 수 있기 때문에, 
              //     재귀적으로 모두 제거해 주는 로직을 추가하면 완벽하게 선택 가능해집니다.
              const removeUnselectableRecursively = (el: Element) => {
                if (el.hasAttribute('unselectable')) {
                  el.removeAttribute('unselectable');
                }
                for (let i = 0; i < el.children.length; i++) {
                  removeUnselectableRecursively(el.children[i]);
                }
              };
              removeUnselectableRecursively(descDiv);
            }
          });
        }
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
 
   // ─────────── 6. 마이크로브 Entity 생성 ───────────
   useLayoutEffect(() => {
     const viewer = viewerInstance.current;
     const dataSource = dataSourceRef.current;
     if (!isViewerInitialized || !viewer || !dataSource) return;
 
     // 엔티티 선택 해제 시 PieChart 닫기
     viewer.selectedEntityChanged.addEventListener(() => {
       if (!viewer.selectedEntity) {
         setSelectedGroup(null);
       }
     });
 
     // 1) 기존 엔티티 삭제
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
 
     // 3) 그룹별로 엔티티 추가
     Object.entries(grouped).forEach(([key, group]) => {
       const [lat, lon] = key.split(',').map(parseFloat);
       const cesiumColor = yearColorMap[group[0].year!] || Color.GRAY;
 
       // InfoBox 콘텐츠 조합// g.sequence undefined/null인지 확인:
       const html = group
       .map((g) => {
          const seqText = g.sequence === null || g.sequence === undefined
            ? 'N/A'
            : g.sequence;
          const displayDate = g.collection_date
            ? g.collection_date.split('T')[0]
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
         name: 'microbes',
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
 
   // ─────────── 7. 오염 아이콘 마커 추가(한 번만) ───────────
   useAddPollutantMarkers(viewerInstance.current, isViewerInitialized);
 
   // ─────────── 8. 체크박스 토글 함수 ───────────
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
 
   // ─────────── 9. 전체 선택 토글 ───────────
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
 
   // ─────────── 10. Play/Pause 버튼 핸들러 ───────────
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
 
   // ─────────── 11. “애니메이션 재생” setInterval 관리 ───────────
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
 
   // ─────────── 12. UI 렌더링 ───────────
   const minYear = uniqueYears.length > 0 ? uniqueYears[0] : 0;
   const maxYear = uniqueYears.length > 0 ? uniqueYears[uniqueYears.length - 1] : 0;
 
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
 
       {/* 2) Cesium Viewer */}
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
 
       {/* 3) PieChartPanel (selectedGroup이 있을 때만 렌더링) */}
       {selectedGroup && (
         <PieChartPanel
           data={selectedGroup}
           isOpen={isPieChartOpen}
           onToggleOpen={() => setIsPieChartOpen((prev) => !prev)}
         />
       )}
     </>
   );
 }