'use client';

import React, { useState, useEffect } from 'react';
import {
  GoogleMap,
  Marker,
  InfoWindow,
  Circle,
} from '@react-google-maps/api';
import type { ProtectedTree } from '@/app/lib/types';

const containerStyle = { width: '100%', height: '100vh' };
const ASAN_CENTER = { lat: 36.81, lng: 126.98 };
const DEFAULT_ZOOM = 11;
const ASAN_RADIUS = 15000;

export default function TreeMapPage() {
  const [trees, setTrees] = useState<ProtectedTree[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [defaultIcon, setDefaultIcon] =
    useState<google.maps.Icon | null>(null);
  const [selectedIcon, setSelectedIcon] =
    useState<google.maps.Icon | null>(null);

  // 1) 보호수 데이터 fetch
  useEffect(() => {
    fetch('/api/trees')
      .then((res) => res.json())
      .then((data: ProtectedTree[]) => setTrees(data));
  }, []);

  // 2) 아이콘 초기화
  useEffect(() => {
    if (window.google && !defaultIcon) {
      setDefaultIcon({
        url: '/images/tree.png',
        scaledSize: new window.google.maps.Size(48, 48),
        anchor: new window.google.maps.Point(24, 48),
      });
      setSelectedIcon({
        url: '/images/tree_s.png',
        scaledSize: new window.google.maps.Size(48, 48),
        anchor: new window.google.maps.Point(24, 48),
      });
    }
  }, [defaultIcon]);

  // 3) 아이콘 준비 전 로딩 표시
  if (!defaultIcon || !selectedIcon) {
    return <div className="p-4">지도 아이콘 로딩 중…</div>;
  }

  const selectedTree = selectedKey
    ? trees.find(
        (t) => `${t.designationNumber}-${t.latitude}-${t.longitude}` === selectedKey
      ) || null
    : null;

  return (
    <>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={ASAN_CENTER}
        zoom={DEFAULT_ZOOM}
        options={{ disableDefaultUI: true, zoomControl: true }}
      >
        {/* 4) 공주시를 예쁜 원으로 강조 */}
        <Circle
          center={ASAN_CENTER}
          radius={ASAN_RADIUS} // 15km 반경
          options={{
            fillColor: 'rgba(235, 200, 135, 0.4)', // 부드러운 하늘색 채우기
            fillOpacity: 0.4,
            strokeColor: 'rgb(255, 75, 43)', // 하늘색 선 (부드러운 느낌)
            strokeOpacity: 0.8,
            strokeWeight: 3, // 약간 두꺼운 선
            clickable: false,
            draggable: false,
            editable: false,
          }}
        />

        {/* 5) 마커 렌더링 (중앙 마커 제거) */}
        {trees.map((tree) => {
          const key = `${tree.designationNumber}-${tree.latitude}-${tree.longitude}`;
          const isSelected = key === selectedKey;

          return (
            <Marker
              key={key}
              position={{ lat: tree.latitude, lng: tree.longitude }}
              icon={isSelected ? selectedIcon : defaultIcon}
              animation={isSelected ? window.google.maps.Animation.BOUNCE : undefined}
              onClick={() => setSelectedKey(key)}
              title={tree.scientificName ?? undefined}
            />
          );
        })}

        {/* 6) 선택된 마커 위에 InfoWindow */}
        {selectedTree && (
          <InfoWindow
            key={selectedKey!}
            position={{ lat: selectedTree.latitude, lng: selectedTree.longitude }}
            options={{ pixelOffset: new window.google.maps.Size(0, -80), disableAutoPan: false }}
            onCloseClick={() => setSelectedKey(null)}
          >
            <div className="info-window-card">
              <div className="card-title">
                {selectedTree.scientificName ?? '이름 없음'}
              </div>
              <div className="card-row">
                <span className="label">지정번호</span>
                <span className="value">{selectedTree.designationNumber ?? '-'}</span>
              </div>
              <div className="card-row">
                <span className="label">보호일자</span>
                <span className="value">
                  {selectedTree.protectionDesignationDate
                    ? new Date(selectedTree.protectionDesignationDate).toLocaleDateString()
                    : '-'}
                </span>
              </div>
              <div className="card-row">
                <span className="label">나무종류</span>
                <span className="value">{selectedTree.treeCategory ?? '-'}</span>
              </div>
              <div className="card-row">
                <span className="label">나이</span>
                <span className="value">
                  {selectedTree.treeAge != null ? `${selectedTree.treeAge}년` : '-'}
                </span>
              </div>
              <div className="card-row">
                <span className="label">관리기관</span>
                <span className="value">{selectedTree.managingAgency ?? '-'}</span>
              </div>
              <div className="card-row">
                <span className="label">주소</span>
                <span className="value">{selectedTree.roadNameAddress ?? '-'}</span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* 7) styled-jsx로 카드 디자인 */}
      <style jsx>{`
        .info-window-card {
          position: relative;
          background: #ffffff;
          border-left: 4px solid #4caf50;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 16px 20px;
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 0.95rem;
          color: #333;
          max-width: 280px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
        }
        .info-window-card::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 10px 10px 0 10px;
          border-style: solid;
          border-color: #ffffff transparent transparent transparent;
        }
        .card-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #2e7d32;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
        }
        .card-title::before {
          content: '🌳';
          margin-right: 8px;
          font-size: 1.2rem;
        }
        .card-row {
          display: flex;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .card-row:last-child {
          margin-bottom: 0;
        }
        .label {
          width: 90px;
          font-weight: 600;
          color: #666;
          text-align: right;
          margin-right: 12px;
        }
        .value {
          flex: 1;
          color: #444;
          word-break: break-word;
        }
        @media (max-width: 768px) {
          .info-window-card {
            max-width: 240px;
            font-size: 0.9rem;
            padding: 12px 16px;
          }
          .card-title {
            font-size: 1rem;
          }
          .label {
            width: 80px;
          }
        }
      `}</style>
    </>
  );
}