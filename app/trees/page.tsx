'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { TreeSample, Metric } from '@/app/lib/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const containerStyle = { width: '100%', height: '100vh' };
const DEFAULT_CENTER = { lat: 36.45, lng: 127.12 };
const DEFAULT_ZOOM = 7;

export default function Page() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['geometry','maps'],
  });

  const [trees, setTrees] = useState<TreeSample[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'decline'>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [defaultIcon, setDefaultIcon] = useState<google.maps.Icon | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<google.maps.Icon | null>(null);

  // 1) pick the metric record for a given kingdom+season
  const getMetric = useCallback(
    (kingdom: string, sampleSeason: string) => {
      const result = metrics.find((m) => m.kingdom === kingdom && m.season === sampleSeason) || { meanFilteredReads: 0, meanRawReads: 0, kingdom: '', season: '' };
      console.log('getMetric:', kingdom, sampleSeason, 'result:', result.meanFilteredReads);
      return result;
    },
    [metrics]
  );

  // 2) determine season for a given tree sample based on sampling dates
  const getSampleSeason = useCallback((t: TreeSample) => {
    const springDate = new Date(t.springSampling);
    const summerDate = new Date(t.summerSampling);
    // Adjust logic: use the most recent sampling year or force a specific season if needed
    const season = springDate.getFullYear() > summerDate.getFullYear() ? 'spring' : 'summer';
    console.log('getSampleSeason for tree', t.id, ':', season, 'spring:', springDate, 'summer:', summerDate);
    return season;
  }, []);

  // 3) total filtered reads for each sample based on its season
  const getTotalReads = useCallback(
    (t: TreeSample) => {
      const sampleSeason = getSampleSeason(t);
      const bacteriaReads = getMetric('bacteria', sampleSeason).meanFilteredReads || 0;
      const fungiReads = getMetric('fungi', sampleSeason).meanFilteredReads || 0;
      const total = bacteriaReads + fungiReads;
      console.log('getTotalReads for tree', t.id, 'season:', sampleSeason, 'bacteria:', bacteriaReads, 'fungi:', fungiReads, 'total:', total);
      return total;
    },
    [getMetric, getSampleSeason]
  );

  // 4) average totalReads across healthy trees
  const healthyAvg = useMemo(() => {
    const healthy = trees.filter((t) => !t.declineSymptoms);
    if (healthy.length === 0) return 1;
    const sum = healthy.reduce((acc, t) => acc + getTotalReads(t), 0);
    const avg = sum / healthy.length;
    console.log('healthyAvg:', avg);
    return avg;
  }, [trees, getTotalReads]);

  // 5) health index = sampleReads / healthyAvg
  const getHealthIndex = useCallback(
    (t: TreeSample) => {
      const index = getTotalReads(t) / healthyAvg;
      console.log('getHealthIndex for tree', t.id, ':', index);
      return index;
    },
    [getTotalReads, healthyAvg]
  );

  // 6) max richness (for marker sizing)
  const maxRichness = useMemo(
    () => {
      const max = Math.max(...trees.map((t) => getTotalReads(t)), 1);
      console.log('maxRichness:', max);
      return max;
    },
    [trees, getTotalReads]
  );

  // 7) color ramp by health index
  const getHealthColor = useCallback(
    (t: TreeSample) => {
      const idx = getHealthIndex(t);
      if (idx >= 1) return 'hsl(120,70%,40%)';
      if (idx >= 0.8) return 'hsl(60,70%,50%)';
      const p = Math.min(1, (0.8 - idx) / 0.8);
      return `hsl(0,70%,${50 - 20 * p}%)`;
    },
    [getHealthIndex]
  );

  // 8) build marker icon
  const makeIcon = useCallback(
    (t: TreeSample, sel: boolean) => {
      const total = getTotalReads(t);
      const scale = 6 + (total / maxRichness) * 16;
      return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: sel ? scale * 1.3 : scale,
        fillColor: sel ? '#2e7d32' : getHealthColor(t),
        fillOpacity: 0.9,
        strokeColor: '#fff',
        strokeWeight: sel ? 2 : 1,
      } as google.maps.Symbol;
    },
    [getTotalReads, getHealthColor, maxRichness]
  );

  // 9) filter by health status
  const filtered = useMemo(
    () =>
      trees.filter((t) => {
        if (statusFilter === 'healthy' && t.declineSymptoms) return false;
        if (statusFilter === 'decline' && !t.declineSymptoms) return false;
        return true;
      }),
    [trees, statusFilter]
  );

  // fetch combined trees + metrics once
  useEffect(() => {
    fetch('/api/eu-trees')
      .then((r) => r.json())
      .then(
        ({
          trees: t,
          metrics: m,
        }: {
          trees: TreeSample[];
          metrics: Metric[];
        }) => {
          console.log('Fetched trees:', t);
          console.log('Fetched metrics:', m);
          setTrees(t);
          setMetrics(m);
        }
      )
      .catch((error) => console.error('Fetch error:', error));
  }, []);

  // prepare custom icons
  useEffect(() => {
    if (isLoaded && window.google) {
      const SZ = 36,
        AH = 18;
      setDefaultIcon({
        url: '/images/tree.png',
        scaledSize: new window.google.maps.Size(SZ, SZ),
        anchor: new window.google.maps.Point(AH, SZ),
      });
      setSelectedIcon({
        url: '/images/tree_s.png',
        scaledSize: new window.google.maps.Size(SZ, SZ),
        anchor: new window.google.maps.Point(AH, SZ),
      });
    }
  }, [isLoaded]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    map.setCenter(DEFAULT_CENTER);
  }, []);

  // early exits
  if (loadError) return <div className="p-4">지도 로드 실패: {loadError.message}</div>;
  if (!isLoaded || !defaultIcon || !selectedIcon) return <div className="p-4">로딩 중...</div>;

  const selTree = trees.find((t) => t.id === selectedId);

  // compute bar chart averages
  const healthyVals = trees.filter((t) => !t.declineSymptoms).map(getTotalReads);
  const declineVals = trees.filter((t) => t.declineSymptoms).map(getTotalReads);
  const avgHealthy =
    healthyVals.reduce((a, v) => a + v, 0) / Math.max(healthyVals.length, 1);
  const avgDecline =
    declineVals.reduce((a, v) => a + v, 0) / Math.max(declineVals.length, 1);

  return (
    <div className="flex h-full">
      {/* Map */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          zoom={DEFAULT_ZOOM}
          onLoad={onMapLoad}
          options={{ disableDefaultUI: true, zoomControl: true }}
        >
          {filtered.map((tree) => {
            const isSel = tree.id === selectedId;
            return (
              <Marker
                key={tree.id}
                position={{ lat: tree.latitude, lng: tree.longitude }}
                icon={makeIcon(tree, isSel)}
                onClick={() => setSelectedId(tree.id)}
                title={`${tree.group} (${tree.area})`}
              />
            );
          })}

          {selTree && (
            <InfoWindow
              position={{ lat: selTree.latitude, lng: selTree.longitude }}
              onCloseClick={() => setSelectedId(null)}
              options={{ pixelOffset: new google.maps.Size(0, -36) }}
            >
              <div className="info-window-card">
                <h4>{`${selTree.group} — ${selTree.area}`}</h4>
                <div className="info-row">
                  <span>Bacteria:</span>
                  <span className="value">
                    {getMetric('bacteria', getSampleSeason(selTree)).meanFilteredReads.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <span>Fungi:</span>
                  <span className="value">
                    {getMetric('fungi', getSampleSeason(selTree)).meanFilteredReads.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <span>Health Index:</span>
                  <span className="value">
                    {(getHealthIndex(selTree) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Controls */}
        <div className="absolute top-4 left-4 bg-white bg-opacity-80 backdrop-blur-md p-3 rounded-lg shadow-md space-y-2">
          <div className="flex items-center space-x-2">
            <label>Season:</label>

          </div>
          <div className="flex items-center space-x-2">
            <label>Status:</label>
            <select
              className="px-2 py-1 border rounded"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="healthy">Healthy</option>
              <option value="decline">Decline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-1/4 p-6 bg-white shadow-inner overflow-auto flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Group Comparison</h3>
        <div style={{ height: 200, marginBottom: 16 }}>
          <Bar
            data={{
              labels: ['Healthy', 'Decline'],
              datasets: [
                {
                  label: 'Avg. Total Reads',
                  data: [avgHealthy, avgDecline],
                  backgroundColor: ['#2e7d32', '#e55e5e'],
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>
        <div className="text-sm text-gray-700">
          <p>• Marker size ∝ total reads</p>
          <p>• Marker color = health index (green→yellow→red)</p>
        </div>
      </aside>

      <style jsx>{`
        .info-window-card {
          min-width: 220px;
          padding: 12px 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
          font-family: 'Noto Sans KR', sans-serif;
        }
        .info-window-card h4 {
          margin: 0 0 8px;
          font-size: 1rem;
          color: #2e7d32;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 4px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .info-row .value {
          font-weight: 600;
          color: #333;
        }
      `}</style>
    </div>
  );
}