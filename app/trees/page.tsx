// app/tree-map/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import type { TreeSample } from '@/app/lib/types';

const containerStyle = {
  width: '100%',
  height: '100vh',
};

const GONGJU_CENTER = { lat: 36.45, lng: 127.12 };
const DEFAULT_ZOOM = 10;

export default function Page() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const [trees, setTrees] = useState<TreeSample[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [defaultIcon, setDefaultIcon] = useState<google.maps.Icon | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<google.maps.Icon | null>(null);

  // 1) API에서 데이터 로드
  useEffect(() => {
    fetch('/api/eu-trees')
      .then((res) => res.json())
      .then((data: TreeSample[]) => setTrees(data))
      .catch(console.error);
  }, []);

  // 2) 아이콘 설정
  useEffect(() => {
    if (isLoaded && window.google) {
      setDefaultIcon({
        url: '/images/tree.png',
        scaledSize: new window.google.maps.Size(36, 36),
        anchor: new window.google.maps.Point(18, 36),
      });
      setSelectedIcon({
        url: '/images/tree_s.png',
        scaledSize: new window.google.maps.Size(36, 36),
        anchor: new window.google.maps.Point(18, 36),
      });
    }
  }, [isLoaded]);

  // 맵 로드 후 중심 설정
  const onMapLoad = useCallback((map: google.maps.Map) => {
    map.setCenter(GONGJU_CENTER);
  }, []);

  if (loadError) return <div>지도 로드 실패: {loadError.message}</div>;
  if (!isLoaded || !defaultIcon || !selectedIcon) return <div>지도 로딩 중...</div>;

  const selectedTree = trees.find((t) => t.id === selectedId) ?? null;

  return (
    <>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={GONGJU_CENTER}
        zoom={DEFAULT_ZOOM}
        onLoad={onMapLoad}
        options={{ disableDefaultUI: true, zoomControl: true }}
      >
        {trees.map((tree) => {
          const isSelected = tree.id === selectedId;
          return (
            <Marker
              key={tree.id}
              position={{ lat: tree.latitude, lng: tree.longitude }}
              icon={isSelected ? selectedIcon : defaultIcon}
              animation={isSelected ? window.google.maps.Animation.BOUNCE : undefined}
              onClick={() => setSelectedId(tree.id)}
              title={`${tree.group} (${tree.area})`}
            />
          );
        })}

        {selectedTree && (
          <InfoWindow
            position={{
              lat: selectedTree.latitude,
              lng: selectedTree.longitude,
            }}
            options={{ pixelOffset: new window.google.maps.Size(0, -40) }}
            onCloseClick={() => setSelectedId(null)}
          >
            <div className="info-window-card">
              <h4>{`${selectedTree.group} — ${selectedTree.area}`}</h4>
              <p>
                <strong>Decline:</strong>{' '}
                {selectedTree.declineSymptoms ? 'Yes' : 'No'}
              </p>
              <p>
                <strong>Replicates:</strong> {selectedTree.replicates}
              </p>
              <p>
                <strong>Spring:</strong>{' '}
                {new Date(selectedTree.springSampling).toLocaleDateString()}
              </p>
              <p>
                <strong>Summer:</strong>{' '}
                {new Date(selectedTree.summerSampling).toLocaleDateString()}
              </p>
              <p>
                <strong>Compartments:</strong> {selectedTree.compartments}
              </p>
              <p>
                <strong>Microbes:</strong> {selectedTree.microorganisms}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      <style jsx>{`
        .info-window-card {
          background: #fff;
          border-left: 4px solid #4caf50;
          border-radius: 6px;
          padding: 12px;
          font-family: sans-serif;
          max-width: 260px;
        }
        h4 {
          margin: 0 0 8px;
          font-size: 1rem;
          color: #2e7d32;
        }
        p {
          margin: 4px 0;
          font-size: 0.85rem;
          color: #333
        }
        strong {
          color: #333;
        }
      `}</style>
    </>
  );
}
