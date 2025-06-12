'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  Circle,
} from '@react-google-maps/api';
import type { ProtectedTree } from '@/app/lib/types';

const containerStyle = {
  width: '100%',
  height: '100vh',
};

const GONGJU_CENTER = { lat: 36.50, lng: 127.06 }; // 공주시 중심
const DEFAULT_ZOOM = 11; // 전체 영역을 보기 위한 줌 레벨
const GONGJU_RADIUS = 17000; // 공주시 대략적인 반경 (미터 단위, 조정 가능)

export default function TreeMapPage() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['geometry'], // geometry 라이브러리 (Circle에 필요)
  });

  const [trees, setTrees] = useState<ProtectedTree[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [defaultIcon, setDefaultIcon] = useState<any>(null);
  const [selectedIcon, setSelectedIcon] = useState<any>(null);

  // 1) API에서 보호수 데이터 로드
  useEffect(() => {
    fetch('/api/trees')
      .then((res) => res.json())
      .then((data: ProtectedTree[]) => setTrees(data))
      .catch(console.error);
  }, []);

  // 2) Google Maps API 로드 후 아이콘 초기화
  useEffect(() => {
    if (isLoaded && window.google) {
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
  }, [isLoaded]);

  // 3) 맵 로드 시 중심을 공주시로 맞춤
  const onMapLoad = useCallback((map: google.maps.Map) => {
    map.setCenter(GONGJU_CENTER);
  }, []);

  if (loadError) return <div>지도 로드 실패: {loadError.message}</div>;
  if (!isLoaded || !defaultIcon || !selectedIcon) return <div>지도 로딩 중...</div>;

  // 선택된 나무 객체 찾기
  const selectedTree = selectedKey
    ? trees.find((t) => `${t.designationNumber}-${t.latitude}-${t.longitude}` === selectedKey)
    : null;

  return (
    <>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={GONGJU_CENTER}
        zoom={DEFAULT_ZOOM}
        onLoad={onMapLoad}
        options={{ disableDefaultUI: true, zoomControl: true }}
      >
        {/* 4) 공주시를 예쁜 원으로 강조 */}
        <Circle
          center={GONGJU_CENTER}
          radius={GONGJU_RADIUS} // 15km 반경
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