// components/SoybeanMarkers.tsx
'use client';

import { useLayoutEffect, useMemo } from 'react';
import {
  CustomDataSource,
  Cartesian3,
  Color,
  LabelStyle,
  VerticalOrigin,
} from 'cesium';
import type { LocationInfo } from '@/app/lib/types';

interface SoybeanMarkersProps {
  dataSource: CustomDataSource | null;
  locations: LocationInfo[];
  isViewerInitialized: boolean;
}

export default function SoybeanMarkers({
  dataSource,
  locations,
  isViewerInitialized,
}: SoybeanMarkersProps) {
  // 1) yield_g, diversity 최솟값·최댓값 계산
  const { minYield, maxYield, minDiv, maxDiv }: {
    minYield: number;
    maxYield: number;
    minDiv: number;
    maxDiv: number;
  } = useMemo(() => {
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let minD = Number.POSITIVE_INFINITY;
    let maxD = Number.NEGATIVE_INFINITY;

    locations.forEach((loc) => {
      if (typeof loc.yield_g === 'number') {
        minY = Math.min(minY, loc.yield_g);
        maxY = Math.max(maxY, loc.yield_g);
      }
      if (typeof loc.diversity === 'number') {
        minD = Math.min(minD, loc.diversity);
        maxD = Math.max(maxD, loc.diversity);
      }
    });

    // 모든 값이 동일하거나 없는 경우 0~1로 기본 설정
    if (!isFinite(minY) || !isFinite(maxY) || minY === maxY) {
      minY = 0; maxY = 1;
    }
    if (!isFinite(minD) || !isFinite(maxD) || minD === maxD) {
      minD = 0; maxD = 1;
    }

    return { minYield: minY, maxYield: maxY, minDiv: minD, maxDiv: maxD };
  }, [locations]);

  useLayoutEffect(() => {
    if (!isViewerInitialized || !dataSource) return;

    const removeIfExists = (id: string) => {
      if (dataSource.entities.getById(id)) {
        dataSource.entities.removeById(id);
      }
    };

    locations.forEach((loc) => {
      const { latitude, longitude, city, location, species, yield_g, diversity,main_microbiome,contribution } = loc;

      // ─────────── (A) 생산량 → 큰 빨간 점 prod-<location> ───────────
      const normY = typeof yield_g === 'number'
        ? (yield_g - minYield) / (maxYield - minYield)
        : 0;
      const minDotSize = 20;
      const maxDotSize = 100;
      const sizeProd = minDotSize + normY * (maxDotSize - minDotSize);
      const prodId = `prod-${location}`;
      removeIfExists(prodId);
      dataSource.entities.add({
        id: prodId,
        position: Cartesian3.fromDegrees(longitude, latitude),
        point: {
          pixelSize: sizeProd,
          color: Color.RED.withAlpha(0.85),
          outlineColor: Color.WHITE.withAlpha(0.9),
          outlineWidth: 1,
        },
        // ← 절대로 name/description을 주지 않음
      });

      // ─────────── (B) 다양성 → 중간 크기 초록 점 div-<location> ───────────
      const normD = typeof diversity === 'number'
        ? (diversity - minDiv) / (maxDiv - minDiv)
        : 0;
      const minDivSize = 10;
      const maxDivSize = 50;
      const sizeDiv = minDivSize + normD * (maxDivSize - minDivSize);
      const divId = `div-${location}`;
      removeIfExists(divId);
      dataSource.entities.add({
        id: divId,
        position: Cartesian3.fromDegrees(longitude, latitude),
        point: {
          pixelSize: sizeDiv,
          color: Color.GREEN.withAlpha(0.7),
          outlineColor: Color.WHITE.withAlpha(0.9),
          outlineWidth: 1,
        },
        // ← 절대로 name/description을 주지 않음
      });

      // ─────────── (C) 중앙 검은 점 + 라벨 point-<location> ───────────
      const pointId = `point-${location}`;
      removeIfExists(pointId);
      dataSource.entities.add({
        id: pointId,
        position: Cartesian3.fromDegrees(longitude, latitude),
        point: {
          pixelSize: 6,
          color: Color.BLACK,
          outlineColor: Color.WHITE,
          outlineWidth: 1,
        },
        label: {
          text: `${city} (${location})`,
          font: 'bold 14px sans-serif',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          backgroundColor: Color.fromAlpha(Color.BLACK, 0.6),
          backgroundPadding: new Cartesian3(6, 4, 0),
          verticalOrigin: VerticalOrigin.TOP,
          pixelOffset: new Cartesian3(0, -20, 0),
        },
        // “중앙 점”만 InfoBox 담당 → 클릭 시 이곳의 name/description이 뜬다.
        name: `${city} (${location})`,
        description: `
          <div style="
            background-color: rgba(32, 34, 37, 0.95);
            padding: 8px;
            color: #ffffff;
            font-size: 14px;
            line-height: 1.4;
            border-radius: 4px;
          ">
            <h3 style="margin-top:0; font-size:20px; color:#fff380;">
              지역 : ${city} (${location})
            </h3>
            <p style="margin:4px 0 4px 0;">
              <strong>품종: </strong> ${species}<br/>
              <strong>위도: </strong> ${latitude}<br/>
              <strong>경도: </strong> ${longitude}
            </p>
            <h4 style="margin-bottom:4px; color:#fff380; font-size:15px;">콩 생산량</h4>
            <p style="margin:0 0 8px 0;">
              ${typeof yield_g === 'number' ? yield_g : 'N/A'} g
            </p>
            <h4 style="margin-bottom:4px; color:#fff380; font-size:15px;">미생물 다양성</h4>
            <p style="margin:0;">
              ${typeof diversity === 'number' ? diversity : 'N/A'}
            </p>
            <h4 style="margin-bottom:4px; color:#fff380; font-size:15px;"> 유효 미생물</h4>
            <p style="margin:4px 0 8px 0;">
              <strong>${main_microbiome}</strong>
            </p>
            <h4 style="margin-bottom:4px; color:#fff380; font-size:15px;"> 역할 및 기능</h4>
            <p style="margin:4px 0 8px 0;">
              <strong>${contribution}</strong>
            </p>
          </div>
        `,
      });
    });
  }, [isViewerInitialized, dataSource, locations, minYield, maxYield, minDiv, maxDiv]);

  return null;
}
