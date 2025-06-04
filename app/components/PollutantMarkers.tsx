'use client';

import { useLayoutEffect } from 'react';
import {
  Viewer,
  Cartesian3,
  VerticalOrigin,
  ConstantProperty,
} from 'cesium';

/**
 * useAddPollutantMarkers 훅:
 * - viewerInstance.current (Cesium Viewer) 와
 * - isViewerInitialized (boolean)
 * 를 받아, 초기화가 완료된 시점(isViewerInitialized===true)에
 * “오염 아이콘” 마커 7개를 뷰어에 한 번만 추가합니다.
 */
export function useAddPollutantMarkers(
  viewer: Viewer | null,
  isInitialized: boolean
) {
  useLayoutEffect(() => {
    if (!isInitialized || !viewer) return;

    // 이미 추가된 동일 ID 엔티티가 있으면 제거
    const removeIfExists = (id: string) => {
      if (viewer.entities.getById(id)) {
        viewer.entities.removeById(id);
      }
    };
    const ids = [
      'pollution-offshore',
      'pollution-nearshore',
      'pollution-nunavut',
      'pollution-northwest',
      'pollution-livingston',
      'pollution-arthurharbor',
      'pollution-larsemann',
    ];
    ids.forEach(removeIfExists);

    // --- (1) Offshore ---
    viewer.entities.add({
      id: 'pollution-offshore',
      position: Cartesian3.fromDegrees(-162.2668, 71.1050),
      billboard: {
        image: 'images/warning-icon.svg',
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

    // --- (2) Nearshore ---
    viewer.entities.add({
      id: 'pollution-nearshore',
      position: Cartesian3.fromDegrees(-156.5241, 71.3647),
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

    // --- (3) Nunavut (Resolute Bay) ---
    viewer.entities.add({
      id: 'pollution-nunavut',
      position: Cartesian3.fromDegrees(-94.8297, 74.6773),
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

    // --- (4) Northwest Passage ---
    viewer.entities.add({
      id: 'pollution-northwest',
      position: Cartesian3.fromDegrees(-127.5333, 70.6000),
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
          <h3 style="margin-top:0; color:#ffcc00;">노스웨스트 패시지(Northwest Passage)</h3>
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

    // --- (5) Livingston Island, Byers Peninsula (남극 해양 퇴적물) ---
    viewer.entities.add({
      id: 'pollution-livingston',
      position: Cartesian3.fromDegrees(-61.1511, -62.6694),
      billboard: {
        image: 'images/warning-icon.svg',
        width: 32,
        height: 32,
        verticalOrigin: VerticalOrigin.CENTER,
      },
      name: 'Livingston Island Marine Sediment Study',
      description: new ConstantProperty(`
        <div style="
          background-color: rgba(32, 34, 37, 0.95);
          padding: 12px;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.4;
          max-width: 300px;
        ">
          <h3 style="margin-top:0; color:#ffcc00;">리빙스턴 섬, 바이러스 반도 (Byers Peninsula, Livingston Island)</h3>
          <p><strong>위치:</strong> 62°40′09.9″ S, –61°09′04″ W</p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 배경</h4>
          <p style="margin:0 0 8px 0;">
            남극 리빙스턴 섬 바이러스 반도는 생태학적으로 보호받는 구역으로,
            연구진은 여기 해양 퇴적물에 모의 급성 유류 유출 실험을 적용하여
            기름이 박테리아 군집에 미치는 영향을 조사했습니다.
          </p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 방법</h4>
          <p style="margin:0 0 8px 0;">
            현장에서 해양 퇴적물을 채취한 뒤 실험실에서 원유를 주입하고 30일간 변화를 관찰.
            DNA 추출 및 메타게놈 시퀀싱을 통해 박테리아 군집 구조 분석했습니다.
          </p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 결과</h4>
          <ul style="margin:0; padding-left:1em;">
            <li>유류 오염은 박테리아 군집에 구조적 변화를 유발했습니다.</li>
            <li>자연 상태에서는 Proteobacteria와 Bacteroidetes가 우점하였으나,</li>
            <li>유류 노출 이후 일부 Alcanivorax 등 기름 분해 세균 상대적 풍부도 증가</li>
            <li>군집 다양성 감소 및 특정 미생물 선택적 활성화 확인</li>
          </ul>
          <h4 style="margin-bottom:4px; color:#ffcc00;">주요 미생물 그룹</h4>
          <ul style="margin:0; padding-left:1em;">
            <li><em>Alcanivorax</em>: 기름 분해에 특화된 해양 박테리아</li>
            <li><em>Pseudoalteromonas</em>, <em>Shewanella</em>: 일부 분해 활성 보였으나 변화 미약</li>
          </ul>
        </div>
      `),
    });

    // --- (6) Arthur Harbor, near Palmer Station (1989년 디젤 유출 사고) ---
    viewer.entities.add({
      id: 'pollution-arthurharbor',
      position: Cartesian3.fromDegrees(-64.0500, -64.7667),
      billboard: {
        image: 'images/warning-icon.svg',
        width: 32,
        height: 32,
        verticalOrigin: VerticalOrigin.CENTER,
      },
      name: 'Arthur Harbor Diesel Spill Study',
      description: new ConstantProperty(`
        <div style="
          background-color: rgba(32, 34, 37, 0.95);
          padding: 12px;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.4;
          max-width: 300px;
        ">
          <h3 style="margin-top:0; color:#ffcc00;">아서 하버 (Arthur Harbor), 팔머 스테이션 인근</h3>
          <p><strong>위치:</strong> 64°46′ S, –64°03′ W</p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 배경</h4>
          <p style="margin:0 0 8px 0;">
            1989년 아서 하버 해역에서 발생한 디젤 유출 사고(Bahia Paraiso 유조선 침몰) 이후, 
            수개월~수년간 미생물 군집 변화 분석 연구가 진행되었습니다.
          </p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 방법</h4>
          <p style="margin:0 0 8px 0;">
            디젤 오염 지역과 비오염 지역의 해수 및 퇴적물을 비교 분석. 
            1989~1991년까지 반복 채취하여 군집 분석과 분해 속도 비교를 실시했습니다.
          </p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 결과</h4>
          <ul style="margin:0; padding-left:1em;">
            <li>오염 직후 분해 활성이 일시적으로 증가했으나, 군집 다양성 감소 및 정상 상태 회복 지연 관찰</li>
            <li>일부 hydrocarbon‐degrading bacteria 비율 증가</li>
            <li>사고 2년 후에도 비오염 지역에 비해 군집 구조 차이 존재</li>
          </ul>
          <h4 style="margin-bottom:4px; color:#ffcc00;">주요 미생물 그룹</h4>
          <ul style="margin:0; padding-left:1em;">
            <li><em>Flavobacterium</em>, <em>Rhodococcus</em>, <em>Pseudomonas</em> 등 탄화수소 분해 능력 보유</li>
            <li>구체적인 종 수준 데이터는 제한적이나, 변화는 속(genus) 중심</li>
          </ul>
        </div>
      `),
    });

    // --- (7) Larsemann Hills, East Antarctica (영구동토 토양) ---
    viewer.entities.add({
      id: 'pollution-larsemann',
      position: Cartesian3.fromDegrees(76.3667, -69.3833),
      billboard: {
        image: 'images/warning-icon.svg',
        width: 32,
        height: 32,
        verticalOrigin: VerticalOrigin.CENTER,
      },
      name: 'Larsemann Hills Permafrost Soil Study',
      description: new ConstantProperty(`
        <div style="
          background-color: rgba(32, 34, 37, 0.95);
          padding: 12px;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.4;
          max-width: 300px;
        ">
          <h3 style="margin-top:0; color:#ffcc00;">라르스만 힐스 (Larsemann Hills), 동남극</h3>
          <p><strong>위치:</strong> 69°23′ S, 76°22′ E</p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 배경</h4>
          <p style="margin:0 0 8px 0;">
            동남극 라르스만 힐스 지역의 영구동토층(permafrost soil)에서 
            미생물 군집 구조를 분석하고, 오염 및 환경요인과의 관계를 평가한 연구입니다.
          </p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 방법</h4>
          <p style="margin:0 0 8px 0;">
            현장에서 토양을 채취하여 DNA 시퀀싱 및 메타게놈 분석을 실시. 
            pH, 염분, 유기물 등 환경요소와 군집 구성 간 상관관계 분석했습니다.
          </p>
          <h4 style="margin-bottom:4px; color:#ffcc00;">연구 결과</h4>
          <ul style="margin:0; padding-left:1em;">
            <li>주요 미생물군: Proteobacteria, Actinobacteria, Bacteroidetes로 구성</li>
            <li>인간 활동에 의한 외래종 유입 가능성 탐지</li>
            <li>토양 특성과 미생물 다양성 간 뚜렷한 상관관계 확인</li>
          </ul>
          <h4 style="margin-bottom:4px; color:#ffcc00;">주요 미생물 그룹</h4>
          <ul style="margin:0; padding-left:1em;">
            <li><em>Actinobacteria</em>: 낮은 온도에서도 유기물 분해 능력</li>
            <li><em>Arthrobacter</em>, <em>Sphingomonas</em>: 극지 환경에서 활동 가능한 복원 능력 보유</li>
          </ul>
        </div>
      `),
    });
  }, [viewer, isInitialized]);
}
