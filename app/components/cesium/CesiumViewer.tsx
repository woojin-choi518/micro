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
  ConstantProperty,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

import { Microbe } from '@/app/lib/types';
import FilterPanel from './FilterPanel';
import PieChartPanel from '../charts/PieChartPanel';
import { useAddPollutantMarkers } from './PollutantMarkers';

declare global {
  interface Window { CESIUM_BASE_URL: string; }
}
(window as Window).CESIUM_BASE_URL = '/Cesium';

// ─── Strain Group HTML Builder ────────────────────────────────────────────────
function buildStrainGroupHtml(grp: any[]) {
  let html = '<div style="background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); color: #000; font-family: Arial, sans-serif; max-height: 300px; overflow-y: auto;">';
  html += '<h2 style="margin: 0 0 12px; font-size: 1.2rem; border-bottom: 2px solid #0000FF; padding-bottom: 4px; color: #000;">Strain Group (Total: ' + grp.length + ')</h2>';

  const categories: Record<string,string[]> = {
    Info:       ['strain_no','scientific_name','catalogue_no'],
    Taxonomy:   ['kingdom','phylum','class','order','family','genus'],
    Geography:  ['locality','latitude','longitude','elevation','depth'],
    Habitats:   ['sampling_site','environment','temperature_c','ph',
                 'salinity_ppt','habitat','host'],
    Culture:    ['culture_media','culture_temperature_c','culture_ph',
                 'culture_aeration','culture_other_condition'],
    Characteristics: ['products','biohazard','other_characteristics'],
  };

  grp.forEach((st, i) => {
    html += '<h3 style="margin: 8px 0; font-size: 1rem; color: #000; border-bottom: 1px solid #ddd;">Strain #' + (i + 1) + ' (' + (st.strain_no || 'N/A') + ')</h3>';
    for (const [cat, keys] of Object.entries(categories)) {
      const data = Object.fromEntries(
        Object.entries(st).filter(([k]) => keys.includes(k))
      );
      if (!Object.keys(data).length) continue;
      html += '<h4 style="margin: 4px 0; font-size: 0.9rem; color: #000; border-bottom: 1px solid #0000FF;">- ' + cat + '</h4>';
      html += '<table style="width: 100%; border-collapse: collapse; background: #f9f9f9; margin-bottom: 8px;">';
      for (const [k,v] of Object.entries(data)) {
        html += `
          <tr style="border-bottom: 1px solid #eee;">
            <th style="text-align: left; padding: 6px; background: #e0e0e0; width: 40%; font-weight: 600; color: #000;">
              ${k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
            </th>
            <td style="padding: 6px; color: #000;">
              ${v ?? '-'}
            </td>
          </tr>`;
      }
      html += '</table>';
    }
    if (i < grp.length - 1) html += '<hr style="border: 0.5px solid #eee; margin: 8px 0;">';
  });

  html += '</div>';
  return html;
}

// ─── Microbe Group HTML Builder with Sequence Loading ─────────────────────────
function buildMicrobeGroupHtml(grp: Microbe[], sequences: Record<string, string | null>) {
  let html = '<div style="background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); color: #000; font-family: Arial, sans-serif; max-height: 300px; overflow-y: auto;">';
  html += '<h2 style="margin: 0 0 12px; font-size: 1.2rem; border-bottom: 2px solid #0000FF; padding-bottom: 4px; color: #000;">Microbe Group (Total: ' + grp.length + ')</h2>';

  const categories = {
    'General': ['organism', 'ncbi_id', 'year'],
    'Sequence': ['sequence'],
  };

  grp.forEach((microbe: Microbe, index) => {
    html += '<h3 style="margin: 8px 0; font-size: 1rem; color: #000; border-bottom: 1px solid #ddd;">Microbe #' + (index + 1) + '</h3>';
    Object.entries(categories).forEach(([category, keys]) => {
      const categoryData = Object.fromEntries(
        Object.entries(microbe).filter(([k]) => keys.includes(k))
      );
      if (category === 'Sequence') {
        categoryData.sequence = sequences[microbe.id] ?? 'Loading...'; // microbe.id는 string
      }
      if (Object.keys(categoryData).length > 0) {
        if (category) {
          html += '<h4 style="margin: 4px 0; font-size: 0.9rem; color: #000; border-bottom: 1px solid #0000FF;">- ' + category + '</h4>';
        }
        html += '<table style="width: 100%; border-collapse: collapse; background: #f9f9f9; margin-bottom: 8px;">';
        Object.entries(categoryData).forEach(([k, v]) => {
          html += `
            <tr style="border-bottom: 1px solid #eee;">
              <th style="text-align: left; padding: 6px; background: #e0e0e0; width: 40%; font-weight: 600; color: #000;">
                ${k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </th>
              <td style="padding: 6px; color: #000;">
                ${v ?? '-'}
              </td>
            </tr>`;
        });
        html += '</table>';
      }
    });
    if (index < grp.length - 1) html += '<hr style="border: 0.5px solid #eee; margin: 8px 0;">';
  });

  html += '</div>';
  return html;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CesiumViewer() {
  const viewerRef     = useRef<HTMLDivElement>(null);
  const viewerInstance= useRef<Viewer|null>(null);
  const microbeDS     = useRef<CustomDataSource|null>(null);
  const strainDS      = useRef<CustomDataSource|null>(null);
  const playInterval  = useRef<NodeJS.Timeout|null>(null);

  const [microbes, setMicrobes] = useState<Microbe[]>([]);
  const [sequences, setSequences] = useState<Record<string, string | null>>({}); // string 키로 변경
  const [error, setError]       = useState<string|null>(null);

  const [initialized, setInitialized]       = useState(false);
  const [selectedGroup, setSelectedGroup]   = useState<Microbe[]|null>(null);
  const [uniqueYears, setUniqueYears]       = useState<number[]>([]);
  const [selectedYears, setSelectedYears]   = useState<number[]>([]);
  const [currentYear, setCurrentYear]       = useState<number|null>(null);
  const [isPlaying, setIsPlaying]           = useState(false);
  const [organismFilter, setOrganismFilter] = useState('');
  const [sequenceFilter, setSequenceFilter] = useState('');
  const [strainFilter, setStrainFilter]     = useState('');
  const [sciNameFilter, setSciNameFilter]   = useState('');
  const [yearPanelOpen, setYearPanelOpen]   = useState(false);
  const [pieOpen, setPieOpen]               = useState(true);

  useAddPollutantMarkers(viewerInstance.current, initialized);

  // unique organism & years
  const uniqueOrganisms = useMemo(() => {
    return Array.from(new Set(microbes.map(m=>m.organism).filter(Boolean))).sort();
  }, [microbes]);

  useEffect(() => {
    const yrs = Array.from(
      new Set(microbes.map(m => m.year).filter((y): y is number => y != null))
    ).sort();
    setUniqueYears(yrs);
    if (yrs.length && currentYear===null) {
      setCurrentYear(yrs[0]);
      setSelectedYears(yrs);
    }
  }, [microbes, currentYear]);

  useEffect(() => {
    if (isPlaying && currentYear!=null) {
      setSelectedYears([currentYear]);
    }
  }, [currentYear, isPlaying]);

  const yearColor = useMemo(() => {
    const map:Record<number,Color> = {};
    uniqueYears.forEach((y,i) => {
      map[y] = Color.fromHsl(i/(uniqueYears.length||1),0.7,0.5);
    });
    return map;
  }, [uniqueYears]);

  // fetch microbes
  useLayoutEffect(() => {
    fetch('/api/microbes')
      .then(r=>r.json())
      .then(setMicrobes)
      .catch(()=>setError('Failed to load microbes.'));
  }, []);

  // init Cesium
  useLayoutEffect(() => {
    if (viewerInstance.current) return;
    if (!viewerRef.current) return setError('No container.');

    const token = process.env.NEXT_PUBLIC_CESIUM_TOKEN;
    if (!token) return setError('Cesium token missing.');
    Ion.defaultAccessToken = token;

    const viewer = new Viewer(viewerRef.current,{
      animation:false,
      timeline:false,
      baseLayerPicker:false,
      selectionIndicator:false,
    });
    viewerInstance.current = viewer;
    let mounted = true;

    const waitScene = (v:Viewer)=> new Promise<any>((res,rej)=>{
      let n=0; (function chk(){
        if(v.scene) res(v.scene);
        else if(n++>50) rej();
        else setTimeout(chk,100);
      })();
    });
    const waitCam = (s:any)=> new Promise<any>((res,rej)=>{
      let n=0; (function chk(){
        if(s.camera) res(s.camera);
        else if(n++>50) rej();
        else setTimeout(chk,100);
      })();
    });

    (async()=>{
      try {
        const scene = await waitScene(viewer);
        if(!mounted) return;
        await waitCam(scene);
        if(!mounted) return;

        const img = await createWorldImageryAsync();
        scene.imageryLayers.removeAll();
        scene.imageryLayers.addImageryProvider(img);
        scene.camera.setView({
          destination: Cartesian3.fromDegrees(-156.9,71.3647,200000),
          orientation:{
            heading:CesiumMath.toRadians(0),
            pitch: CesiumMath.toRadians(-80),
            roll:0,
          },
        });
        if(!mounted) return;

        // microbes DS
        const mds = new CustomDataSource('microbes');
        mds.clustering.enabled = false;
        microbeDS.current = mds;
        await viewer.dataSources!.add(mds);

        // strains DS
        const sds = new CustomDataSource('strains');
        sds.clustering.enabled = false;
        strainDS.current = sds;
        await viewer.dataSources!.add(sds);

        // fetch strains, group by exact coords
        const list:any[] = await fetch('/api/strains').then(r=>r.json());
        const grouped: Record<string,any[]> = {};
        list.forEach(st=>{
          if(st.latitude!=null && st.longitude!=null){
            const key = `${st.latitude.toFixed(5)},${st.longitude.toFixed(5)}`;
            (grouped[key]||=[]).push(st);
          }
        });

        Object.entries(grouped).forEach(([key,grp])=>{
          const [lat,lon] = key.split(',').map(Number);
          const desc = buildStrainGroupHtml(grp);
          const ent = sds.entities.add({
            id: `strain-group-${key}`,
            name: 'strain',
            position: Cartesian3.fromDegrees(lon,lat),
            point: { pixelSize:20, color:Color.GOLDENROD},
            label:{
              text: grp.length===1?grp[0].strain_no||'-':`${grp.length} strains`,
              font: 'bold 14px sans-serif',
              fillColor:Color.WHITE,
              outlineColor:Color.BLACK,
              outlineWidth:2,
              style:LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin:VerticalOrigin.BOTTOM,
              pixelOffset:new Cartesian3(0,20),
            },
            description: desc,
          });
          (ent as any).data = grp;
        });

        setInitialized(true);
      } catch(e){
        console.error(e);
        if(mounted) setError('Init failed.');
      }
    })();

    return ()=>{
      mounted=false;
      viewer.destroy();
      viewerInstance.current=null;
    };
  }, []);

// Initial marker rendering
useLayoutEffect(() => {
  if (!initialized || !microbeDS.current) return;
  const mds = microbeDS.current!;
  mds.entities.removeAll();

  // 클러스터링 비활성화
  mds.clustering.enabled = false;

  // 좌표별 그룹화
  const grouped: Record<string, Microbe[]> = {};
  microbes.forEach((m: Microbe) => {
    const okY = selectedYears.includes(m.year!);
    const okO = !organismFilter || (m.organism && m.organism.toLowerCase().includes(organismFilter.toLowerCase()));
    if (okY && okO && m.latitude != null && m.longitude != null) {
      const key = `${m.latitude.toFixed(5)},${m.longitude.toFixed(5)}`;
      (grouped[key] ||= []).push(m);
    }
  });

  Object.entries(grouped).forEach(([key, grp]) => {
    const [lat, lon] = key.split(',').map(Number);
    const col = yearColor[grp[0].year!] || Color.GRAY;
    const html = buildMicrobeGroupHtml(grp, sequences);

    const entity = mds.entities.add({
      position: Cartesian3.fromDegrees(lon, lat),
      point: { pixelSize: 10, color: col },
      label: {
        text: grp.length === 1 ? (grp[0].organism || 'Unknown') : `${grp.length} microbes`,
        font: 'bold 14px sans-serif',
        fillColor: Color.WHITESMOKE,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        style: LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: VerticalOrigin.TOP,
        pixelOffset: new Cartesian3(0, -15),
      },
      name: 'microbes',
      properties: { group: new ConstantProperty(grp) },
      description: new ConstantProperty(html),
      show: true,
    });
    (entity as any).groupKey = key;
  });
}, [initialized, microbes, selectedYears, organismFilter, yearColor]);

// Dynamic filtering based on sequenceFilter and sequences
useEffect(() => {
  if (!initialized || !microbeDS.current) return;
  const mds = microbeDS.current!;

  // 필터링된 microbe 리스트 생성
  const filteredMicrobes = microbes.filter((m) => {
    const okY = selectedYears.includes(m.year!);
    const okO = !organismFilter || (m.organism && m.organism.toLowerCase().includes(organismFilter.toLowerCase()));
    const seqFromAPI = sequences[m.id];
    const seqFromData = m.sequence;
    const okS = !sequenceFilter ||
                (seqFromAPI && seqFromAPI.toLowerCase().includes(sequenceFilter.toLowerCase())) ||
                (seqFromData && seqFromData.toLowerCase().includes(sequenceFilter.toLowerCase()));
    return okY && okO && okS && m.latitude != null && m.longitude != null;
  });

  // 좌표별로 필터링된 그룹 생성
  const filteredGroups: Record<string, Microbe[]> = {};
  filteredMicrobes.forEach((m) => {
    const key = `${m.latitude!.toFixed(5)},${m.longitude!.toFixed(5)}`;
    (filteredGroups[key] ||= []).push(m);
  });

  // 마커 가시성 및 설명 업데이트
  mds.entities.values.forEach((entity) => {
    if (entity.name !== 'microbes') return;
    const key = (entity as any).groupKey;
    const filteredGrp = filteredGroups[key] || [];
    entity.show = filteredGrp.length > 0;

    // description 업데이트 시 null 체크
    if (entity.description) {
      entity.description = new ConstantProperty(filteredGrp.length > 0 
        ? buildMicrobeGroupHtml(filteredGrp, sequences) 
        : '<div>No data available</div>');
    }

    // label 업데이트 시 안전하게 처리
    if (entity.label && filteredGrp.length > 0) {
      entity.label.text = new ConstantProperty(
        filteredGrp.length === 1 ? (filteredGrp[0].organism || 'Unknown') : `${filteredGrp.length} microbes`
      );
    }
  });

  // selectedGroup 업데이트
  if (selectedGroup && selectedGroup.length > 0) {
    const currentKey = `${selectedGroup[0].latitude!.toFixed(5)},${selectedGroup[0].longitude!.toFixed(5)}`;
    const filteredSelected = filteredGroups[currentKey] || [];
    setSelectedGroup(filteredSelected.length > 0 ? filteredSelected : null);
  }
}, [initialized, microbes, selectedYears, organismFilter, sequenceFilter, sequences]);

  // filter & rebuild strain-groups
  useEffect(() => {
    if (!initialized || !strainDS.current) return;
    const lowerNo  = strainFilter.toLowerCase();
    const lowerSci = sciNameFilter.toLowerCase();

    strainDS.current.entities.values.forEach(ent => {
      const grp = (ent as any).data as any[];
      if (!Array.isArray(grp)) return;

      const filtered = grp.filter(st => {
        const no  = String(st.strain_no ?? '').toLowerCase();
        const scik= String(st.scientific_name ?? st.scientificName ?? '').toLowerCase();
        return (!lowerNo  || no.includes(lowerNo))
            && (!lowerSci || scik.includes(lowerSci));
      });

      ent.show = filtered.length > 0;

      if (filtered.length > 0) {
        const lbl = ent.label!;  
        lbl.text = new ConstantProperty(
          filtered.length === 1
            ? filtered[0].strain_no || '-'
            : `${filtered.length} strains`
        );
        ent.description = new ConstantProperty(
          buildStrainGroupHtml(filtered)
        );
      }
    });
  }, [initialized, strainFilter, sciNameFilter]);

  // click-handler for InfoBox and sequence fetching
  useEffect(() => {
    if (!initialized || !viewerInstance.current) return;
    const vh = viewerInstance.current;
    const handler = new ScreenSpaceEventHandler(vh.scene.canvas);
    handler.setInputAction(async (evt: any) => {
      const pick = vh.scene.pick(evt.position);
      if (pick?.id?.name === 'microbes') {
        const grp = pick.id.properties.group.getValue() as Microbe[];
        vh.selectedEntity = pick.id;
        setSelectedGroup(grp); // 그룹 전체 선택
  
        const [lat, lon] = [grp[0].latitude!, grp[0].longitude!];
        try {
          const response = await fetch(`/api/microbes/sequences?latitude=${lat}&longitude=${lon}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const sequenceData = await response.json();
          setSequences((prev) => ({
            ...prev,
            ...sequenceData,
          }));
  
          pick.id.description = new ConstantProperty(buildMicrobeGroupHtml(grp, { ...sequences, ...sequenceData }));
        } catch (err) {
          console.error('Sequence fetch error:', err);
          setError('Failed to load sequence data.');
        }
      } else if (pick?.id?.name === 'strain') {
        vh.selectedEntity = pick.id;
        setSelectedGroup(null);
      } else {
        vh.selectedEntity = undefined;
        setSelectedGroup(null);
      }
    }, ScreenSpaceEventType.LEFT_CLICK);
    return () => handler.destroy();
  }, [initialized, sequences]);

  // make InfoBox text selectable
  useEffect(() => {
    if (!initialized || !viewerInstance.current) return;
    const apply = () => {
      const iframe = document.querySelector('.cesium-infoBox iframe') as HTMLIFrameElement;
      if (iframe?.contentDocument) {
        const style = iframe.contentDocument.createElement('style');
        style.textContent = `*{user-select:text!important;pointer-events:auto!important;}`;
        iframe.contentDocument.head.appendChild(style);
        iframe.setAttribute('sandbox',
          'allow-same-origin allow-popups allow-forms allow-scripts allow-pointer-lock'
        );
      }
    };
    const obs = new MutationObserver(apply);
    obs.observe(document.body, { childList:true, subtree:true });
    apply();
    return () => obs.disconnect();
  }, [initialized]);

  // year animation controls
  const toggleYear = useCallback((y:number)=>{
    if(isPlaying) setIsPlaying(false);
    setSelectedYears(s=> s.includes(y)? s.filter(x=>x!==y): [...s,y]);
  },[isPlaying]);

  const toggleAll = useCallback(()=>{
    if(isPlaying) setIsPlaying(false);
    setSelectedYears(s=> s.length===uniqueYears.length? []: [...uniqueYears]);
  },[isPlaying,uniqueYears]);
  
  const playPause = useCallback(()=>{
    if(!isPlaying && uniqueYears.length){
      setCurrentYear(uniqueYears[0]);
      setSelectedYears([uniqueYears[0]]);
    }
    setIsPlaying(p=>!p);
  },[isPlaying,uniqueYears]);

  useEffect(()=>{
    if(!isPlaying){
      if(playInterval.current) clearInterval(playInterval.current);
      return;
    }
    playInterval.current = setInterval(()=>{
      setCurrentYear(prev=>{
        if(prev===null) return uniqueYears[0];
        const i = uniqueYears.indexOf(prev);
        if(i===uniqueYears.length-1){ setIsPlaying(false); return prev; }
        return uniqueYears[i+1];
      });
    },1000);
    return ()=>{ if(playInterval.current) clearInterval(playInterval.current); };
  },[isPlaying,uniqueYears]);

  const minYear = uniqueYears[0]||0;
  const maxYear = uniqueYears[uniqueYears.length-1]||0;

  return (
    <>
      {error && (
        <div className="absolute top-4 left-4 z-50 bg-red-500 text-white p-2 rounded">
          {error}
        </div>
      )}

      <FilterPanel
        uniqueYears={uniqueYears}
        selectedYears={selectedYears}
        onToggleYear={toggleYear}
        onToggleSelectAll={toggleAll}
        minYear={minYear}
        maxYear={maxYear}
        currentYear={currentYear}
        isPlaying={isPlaying}
        onPlayPause={playPause}
        onChangeSlider={(y) => setCurrentYear(y)}
        uniqueOrganisms={uniqueOrganisms}
        organismFilter={organismFilter}
        onOrganismFilterChange={setOrganismFilter}
        sequenceFilter={sequenceFilter}
        onSequenceFilterChange={setSequenceFilter}
        strainFilter={strainFilter}
        onStrainFilterChange={setStrainFilter}
        sciNameFilter={sciNameFilter}
        onSciNameFilterChange={setSciNameFilter}
        isOpen={yearPanelOpen}
        onToggleOpen={() => setYearPanelOpen(o => !o)}
      />

      <div
        ref={viewerRef}
        style={{ position: 'absolute', top: '64px', left: 0, right: 0, bottom: 0 }}
      />

      {selectedGroup && (
        <PieChartPanel
          data={selectedGroup}
          coords={{
            lat: selectedGroup[0].latitude!,
            lon: selectedGroup[0].longitude!,
          }}
          isOpen={pieOpen}
          onToggleOpen={() => setPieOpen(o => !o)}
        />
      )}
    </>
  );
}