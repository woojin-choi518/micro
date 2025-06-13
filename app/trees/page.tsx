// app/trees/page.tsx

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
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
const DEFAULT_CENTER = { lat: 36.88, lng: -3.9 };
const DEFAULT_ZOOM = 7;

export default function Page() {
  // ── 상태 ─────────────────────────────────────────────────────────
  const [trees, setTrees] = useState<TreeSample[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'decline'>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [defaultIcon, setDefaultIcon] = useState<google.maps.Icon | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<google.maps.Icon | null>(null);

  // ── 계산 훅 ───────────────────────────────────────────────────────
  const getMetric = useCallback(
    (kingdom: string, season: string) =>
      metrics.find((m) => m.kingdom === kingdom && m.season === season) || {
        meanFilteredReads: 0,
        meanRawReads: 0,
        kingdom: '',
        season: '',
      },
    [metrics]
  );

  const getSampleSeason = useCallback((t: TreeSample) => {
    const spring = new Date(t.springSampling).getFullYear();
    const summer = new Date(t.summerSampling).getFullYear();
    return spring > summer ? 'spring' : 'summer';
  }, []);

  const getTotalReads = useCallback(
    (t: TreeSample) => {
      const season = getSampleSeason(t);
      const bac = getMetric('bacteria', season).meanFilteredReads;
      const fun = getMetric('fungi', season).meanFilteredReads;
      return (bac || 0) + (fun || 0);
    },
    [getMetric, getSampleSeason]
  );

  const healthyAvg = useMemo(() => {
    const healthy = trees.filter((t) => !t.declineSymptoms);
    if (healthy.length === 0) return 1;
    return healthy.reduce((sum, t) => sum + getTotalReads(t), 0) / healthy.length;
  }, [trees, getTotalReads]);

  const getHealthIndex = useCallback(
    (t: TreeSample) => getTotalReads(t) / healthyAvg,
    [getTotalReads, healthyAvg]
  );

  const maxRichness = useMemo(() => {
    return Math.max(...trees.map(getTotalReads), 1);
  }, [trees, getTotalReads]);

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

  const filteredTrees = useMemo(
    () =>
      trees.filter((t) => {
        if (statusFilter === 'healthy' && t.declineSymptoms) return false;
        if (statusFilter === 'decline' && !t.declineSymptoms) return false;
        return true;
      }),
    [trees, statusFilter]
  );

  // ── 이펙트 ────────────────────────────────────────────────────────
  // 데이터 fetch (한 번만)
  useEffect(() => {
    fetch('/api/eu-trees')
      .then((r) => r.json())
      .then(({ trees: t, metrics: m }) => {
        setTrees(t);
        setMetrics(m);
      })
      .catch(console.error);
  }, []);

  // 아이콘 초기화 (스크립트는 layout에서 이미 로드됨)
  useEffect(() => {
    if (window.google && !defaultIcon) {
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
  }, [defaultIcon]);

  // ── 로딩 상태 ───────────────────────────────────────────────────
  if (!defaultIcon || !selectedIcon) {
    return <div className="p-4">지도 아이콘 로딩 중…</div>;
  }

  // ── 렌더 ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-full">
      {/* Map 영역 */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          options={{ disableDefaultUI: true, zoomControl: true }}
        >
          {filteredTrees.map((tree) => {
            const isSel = tree.id === selectedId;
            return (
              <Marker
                key={tree.id}
                position={{ lat: tree.latitude, lng: tree.longitude }}
                icon={makeIcon(tree, isSel)}
                onClick={() => setSelectedId(tree.id)}
              />
            );
          })}

          {selectedId !== null && (
            <InfoWindow
              position={{
                lat: trees.find((t) => t.id === selectedId)!.latitude,
                lng: trees.find((t) => t.id === selectedId)!.longitude,
              }}
              onCloseClick={() => setSelectedId(null)}
              options={{ pixelOffset: new google.maps.Size(0, -36) }}
            >
              <div className="info-window-card">
                <h4>{`${trees.find((t) => t.id === selectedId)!.group} — ${
                  trees.find((t) => t.id === selectedId)!.area
                }`}</h4>
                <div className="info-row">
                  <span>Bacteria:</span>
                  <span className="value">
                    {getMetric(
                      'bacteria',
                      getSampleSeason(
                        trees.find((t) => t.id === selectedId)!
                      )
                    ).meanFilteredReads.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <span>Fungi:</span>
                  <span className="value">
                    {getMetric(
                      'fungi',
                      getSampleSeason(
                        trees.find((t) => t.id === selectedId)!
                      )
                    ).meanFilteredReads.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <span>Health Index:</span>
                  <span className="value">
                    {(getHealthIndex(
                      trees.find((t) => t.id === selectedId)!
                    ) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* 필터 컨트롤 */}
        <div className="absolute top-4 left-4 bg-white bg-opacity-80 backdrop-blur-md p-3 rounded-lg shadow-md">
          <label className="mr-2">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | 'healthy' | 'decline')
            }
            className="px-2 py-1 border rounded"
          >
            <option value="all">All</option>
            <option value="healthy">Healthy</option>
            <option value="decline">Decline</option>
          </select>
        </div>
      </div>

      {/* 사이드바: 차트 */}
      <aside className="w-1/4 p-6 bg-white shadow-inner overflow-auto">
        <h3 className="text-lg font-semibold mb-4">Group Comparison</h3>
        <div style={{ height: 200 }}>
          <Bar
            data={{
              labels: ['Healthy', 'Decline'],
              datasets: [
                {
                  label: 'Avg. Total Reads',
                  data: [
                    trees.filter((t) => !t.declineSymptoms).length
                      ? trees
                          .filter((t) => !t.declineSymptoms)
                          .reduce((acc, t) => acc + getTotalReads(t), 0) /
                          Math.max(
                            trees.filter((t) => !t.declineSymptoms).length,
                            1
                          )
                      : 0,
                    trees.filter((t) => t.declineSymptoms).length
                      ? trees
                          .filter((t) => t.declineSymptoms)
                          .reduce((acc, t) => acc + getTotalReads(t), 0) /
                          Math.max(
                            trees.filter((t) => t.declineSymptoms).length,
                            1
                          )
                      : 0,
                  ],
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
      </aside>

      {/* InfoWindow 스타일 */}
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
          margin-bottom: 8px;
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
        .value {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
