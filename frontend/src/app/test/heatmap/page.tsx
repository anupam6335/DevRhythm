'use client';

import React, { useState, useEffect } from 'react';
import Heatmap from '@/shared/components/Heatmap';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import type { HeatmapData } from '@/shared/types';
import rawData from './dummy-heatmap-2026.json';

interface ApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: HeatmapData;
  meta?: any;
}

export default function HeatmapTestPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);

  // Simulate loading delay
  useEffect(() => {
    const timer = setTimeout(() => {
      const apiResponse = rawData as ApiResponse;
      setHeatmapData(apiResponse.data);
      setIsLoading(false);
    }, 2000); // 2 second loading simulation

    return () => clearTimeout(timer);
  }, []);

  const handleCellClick = (date: Date) => {
    console.log('Cell clicked:', date.toISOString());
  };

  // Custom skeleton for heatmap - matches the heatmap layout
  const renderHeatmapSkeleton = () => {
    return (
      <div style={{ display: 'flex', gap: '16px', minWidth: 'fit-content' }}>
        {/* Generate 12 month skeletons */}
        {Array.from({ length: 12 }, (_, monthIndex) => (
          <div key={monthIndex} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Month label skeleton */}
            <SkeletonLoader
              variant="text"
              width={32}
              height={16}
              style={{ margin: '0 auto' }}
            />
            {/* Month grid skeleton - 7 rows x variable columns */}
            <div
              style={{
                display: 'grid',
                gridTemplateRows: 'repeat(7, 12px)',
                gridTemplateColumns: 'repeat(5, 12px)', // Most months have 5 weeks
                gap: '2px',
              }}
            >
              {Array.from({ length: 7 * 5 }, (_, cellIndex) => (
                <SkeletonLoader
                  key={cellIndex}
                  variant="custom"
                  width={12}
                  height={12}
                  style={{ borderRadius: '2px' }}
                />
              ))}
            </div>
          </div>
        ))}
        {/* Preview January skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.6 }}>
          <SkeletonLoader
            variant="text"
            width={32}
            height={16}
            style={{ margin: '0 auto' }}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateRows: 'repeat(7, 12px)',
              gridTemplateColumns: 'repeat(5, 12px)',
              gap: '2px',
            }}
          >
            {Array.from({ length: 7 * 5 }, (_, cellIndex) => (
              <SkeletonLoader
                key={cellIndex}
                variant="custom"
                width={12}
                height={12}
                style={{ borderRadius: '2px' }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="devRhythmContainer" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h1
        style={{
          fontFamily: 'var(--font-heading)',
          marginBottom: '1rem',
          color: 'var(--text-primary)',
        }}
      >
        Heatmap Year 2026-27 Test 
      </h1>

      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow)',
        }}
      >
        {isLoading ? (
          <div style={{ overflowX: 'auto', paddingBottom: 'var(--spacing-md)' }}>
            {renderHeatmapSkeleton()}
          </div>
        ) : (
          heatmapData && (
            <Heatmap
              data={heatmapData}
              onCellClick={handleCellClick}
              showNextYearPreview={true}
            />
          )
        )}
      </div>

      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
        {isLoading ? 'Loading heatmap data...' : 'Heatmap loaded successfully!'}
      </p>
    </div>
  );
}