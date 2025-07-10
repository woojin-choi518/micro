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
  Color,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

import { Microbe } from '@/app/lib/types';
import FilterPanel from './FilterPanel';
import PieChartPanel from '../charts/PieChartPanel';
import { useAddPollutantMarkers } from './PollutantMarkers';

declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}
(window as Window).CESIUM_BASE_URL = '/Cesium';

export default function CesiumViewer() {
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<Viewer | null>(null);
  const microbeDataSourceRef = useRef<CustomDataSource | null>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [microbes, setMicrobes] = useState<Microbe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isViewerInitialized, setIsViewerInitialized] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Microbe[] | null>(null);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [uniqueYears, setUniqueYears] = useState<number[]>([]);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [organismFilter, setOrganismFilter] = useState<string>('');
  const [sequenceFilter, setSequenceFilter] = useState<string>('');
  const [isYearPanelOpen, setIsYearPanelOpen] = useState<boolean>(false);
  const [isPieChartOpen, setIsPieChartOpen] = useState<boolean>(true);

  const uniqueOrganisms = useMemo(
    () =>
      Array.from(
        new Set(microbes.map((m) => m.organism).filter((o) => o != null))
      ).sort(),
    [microbes]
  );

  useEffect(() => {
    const years = Array.from(
      new Set(microbes.map((m) => m.year).filter((y): y is number => y != null))
    ).sort();
    setUniqueYears(years);
    if (years.length > 0 && currentYear === null) {
      setCurrentYear(years[0]);
      setSelectedYears(years);
    }
  }, [microbes, currentYear]);

  const yearColorMap = useMemo(() => {
    const map: Record<number, Color> = {};
    uniqueYears.forEach((year, idx) => {
      const N = uniqueYears.length || 1;
      const hue = (idx / N) * 360;
      map[year] = Color.fromHsl(hue / 360, 0.7, 0.5);
    });
    return map;
  }, [uniqueYears]);

  useLayoutEffect(() => {
    fetch('/api/microbes')
      .then((res) => res.json())
      .then((data: Microbe[]) => setMicrobes(data))
      .catch((err) => {
        console.error('Fetch /api/microbes error:', err);
        setError('Failed to load microbe data.');
      });
  }, []);

  useEffect(() => {
    if (isPlaying && currentYear !== null) {
      setSelectedYears([currentYear]);
    }
  }, [currentYear, isPlaying]);

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
      selectionIndicator: false,
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

        const mds = new CustomDataSource('microbes');
        mds.clustering.enabled = false;
        microbeDataSourceRef.current = mds;
        await viewer.dataSources?.add(mds);

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

  const handleSelectGroup = useCallback((group: Microbe[] | null) => {
    setSelectedGroup(group);
  }, []);

  useLayoutEffect(() => {
    if (!isViewerInitialized) return;
    const mds = microbeDataSourceRef.current!;
    if (!mds) return;

    mds.entities.removeAll();

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

    const escapeHtml = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    Object.entries(grouped).forEach(([key, group]) => {
      const [lat, lon] = key.split(',').map(parseFloat);
      const cesiumColor = yearColorMap[group[0].year!] || Color.GRAY;

      const html = group
        .map((g) => {
          const seqText =
            g.sequence === null || g.sequence === undefined
              ? 'N/A'
              : escapeHtml(g.sequence);
          const displayDate = g.collection_date
            ? g.collection_date!.split('T')[0]
            : 'N/A';

          return `
            <strong style="color:#fff380;">${escapeHtml(g.organism)}</strong><br/>
            <span style="color:#cccccc;">NCBI ID:</span> 
            <span style="color:#ffffff;">${escapeHtml(g.ncbi_id)}</span><br/>
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
        properties: {
          group: group,
        },
        description: `
          <div style="background-color: rgba(32, 34, 37, 0.95); padding: 10px; color: #ffffff; max-height: 300px; font-size: 16px; user-select: text; -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text;">
            ${html}
          </div>
        `,
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

  useEffect(() => {
    if (!isViewerInitialized || !viewerInstance.current) return;
    const viewer = viewerInstance.current;
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((evt: any) => {
      const pick = viewer.scene.pick(evt.position);
      if (pick?.id?.name === 'microbes') {
        viewer.selectedEntity = pick.id;
        handleSelectGroup(pick.id.properties.group.getValue());
      } else {
        viewer.selectedEntity = undefined;
        handleSelectGroup(null);
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
    };
  }, [isViewerInitialized, handleSelectGroup]);

  useEffect(() => {
    if (!isViewerInitialized || !viewerInstance.current) return;

    const applyTextSelect = () => {
      const iframe = document.querySelector('.cesium-infoBox iframe') as HTMLIFrameElement;
      if (iframe?.contentDocument) {
        const style = iframe.contentDocument.createElement('style');
        style.textContent = `
          * {
            user-select: text !important;
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            pointer-events: auto !important;
          }
        `;
        iframe.contentDocument.head.appendChild(style);
        iframe.setAttribute('sandbox', 'allow-same-origin allow-popups allow-forms allow-scripts allow-pointer-lock');
      }
    };

    const observer = new MutationObserver(() => {
      applyTextSelect();
    });
    observer.observe(document.querySelector('.cesium-infoBox') || document.body, {
      childList: true,
      subtree: true,
    });

    applyTextSelect();

    return () => {
      observer.disconnect();
    };
  }, [isViewerInitialized]);

  useAddPollutantMarkers(viewerInstance.current, isViewerInitialized);

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

  const minYear = uniqueYears.length > 0 ? uniqueYears[0] : 0;
  const maxYear =
    uniqueYears.length > 0 ? uniqueYears[uniqueYears.length - 1] : 0;

  return (
    <>
      {error && (
        <div className="absolute top-4 left-4 z-50 bg-red-500 text-white p-2 rounded shadow">
          {error}
        </div>
      )}
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
    </>
  );
}