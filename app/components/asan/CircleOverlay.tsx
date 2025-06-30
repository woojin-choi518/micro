// CircleOverlay.tsx
'use client';
import { useEffect } from 'react';

export interface CircleOverlayProps {
  map: google.maps.Map;
  center: google.maps.LatLngLiteral;
  radius: number;    // meters
  color: string;     // hex
}

function hexToRgb(hex: string) {
  const c = hex.replace(/^#/, '');
  const i = parseInt(c,16);
  return { r: (i>>16)&255, g: (i>>8)&255, b: i&255 };
}

export default function CircleOverlay({
  map, center, radius, color
}: CircleOverlayProps){
  useEffect(()=>{
    if(!map) return;
    class CircleView extends google.maps.OverlayView {
      canvas = document.createElement('canvas');
      constructor(){ super(); this.canvas.style.pointerEvents='none'; }
      onAdd(){
        this.getPanes()!.overlayLayer.appendChild(this.canvas);
      }
      draw(){
        const proj = this.getProjection(); if(!proj) return;
        const latlng = new google.maps.LatLng(center);
        const pxCenter = proj.fromLatLngToDivPixel(latlng);
        const pxEdge   = proj.fromLatLngToDivPixel(
          google.maps.geometry.spherical.computeOffset(latlng, radius, 90)
        );
        const rpx = Math.hypot(pxEdge.x-pxCenter.x, pxEdge.y-pxCenter.y);
        const d = rpx*2;
        this.canvas.width = d; this.canvas.height = d;
        this.canvas.style.position='absolute';
        this.canvas.style.left=`${pxCenter.x-rpx}px`;
        this.canvas.style.top =`${pxCenter.y-rpx}px`;

        const ctx = this.canvas.getContext('2d')!;
        ctx.clearRect(0,0,d,d);
        const {r,g,b} = hexToRgb(color);
        const grad = ctx.createRadialGradient(rpx,rpx,0, rpx,rpx,rpx);
        grad.addColorStop(0, `rgba(${r},${g},${b},0.4)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(rpx,rpx,rpx,0,2*Math.PI); ctx.fill();
      }
      onRemove(){
        this.canvas.parentNode?.removeChild(this.canvas);
      }
    }
    const ov = new CircleView();
    ov.setMap(map);
    return ()=>ov.setMap(null);
  },[map, center.lat, center.lng, radius, color]);
  return null;
}
