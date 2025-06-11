// components/FloatingPanel.tsx
'use client';

import React, { ReactNode } from 'react';

interface FloatingPanelProps {
  children: ReactNode;
  className?: string;
}

export default function FloatingPanel({
  children,
  className = '',
}: FloatingPanelProps) {
  return (
    <div
      className={`
        bg-white/20 backdrop-blur-md
        border border-white/40
        rounded-2xl shadow-lg
        p-4
        ${className}
      `}
    >
      {children}
    </div>
  );
}