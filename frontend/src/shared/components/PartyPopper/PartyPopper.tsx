'use client';

import React, { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import styles from './PartyPopper.module.css';

export interface PartyPopperRef {
  fire: () => void;
}

interface Particle {
  id: number;
  color: string;
  left: number;
  top: number;
  angle: number;
  velocity: number;
  size: number;
}

const colors = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'];

const PARTICLE_COUNT = 60;
const DURATION = 1500; // ms

export const PartyPopper = forwardRef<PartyPopperRef>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const activeParticles = useRef<Set<number>>(new Set());

  const cleanupParticle = useCallback((id: number) => {
    const element = document.getElementById(`particle-${id}`);
    if (element) element.remove();
    activeParticles.current.delete(id);
  }, []);

  const fire = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 5 + Math.random() * 15;
      const size = 6 + Math.random() * 8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        id: nextId.current++,
        color,
        left: centerX,
        top: centerY,
        angle,
        velocity,
        size,
      });
    }

    particles.forEach(p => {
      const div = document.createElement('div');
      div.id = `particle-${p.id}`;
      div.className = styles.particle;
      div.style.backgroundColor = p.color;
      div.style.width = `${p.size}px`;
      div.style.height = `${p.size}px`;
      div.style.left = `${p.left}px`;
      div.style.top = `${p.top}px`;
      div.style.setProperty('--angle', `${p.angle}rad`);
      div.style.setProperty('--velocity', `${p.velocity}`);
      div.style.setProperty('--size', `${p.size}px`);
      containerRef.current?.appendChild(div);
      activeParticles.current.add(p.id);

      // Remove after animation ends
      const onEnd = () => {
        cleanupParticle(p.id);
        div.removeEventListener('animationend', onEnd);
      };
      div.addEventListener('animationend', onEnd);
    });
  }, [cleanupParticle]);

  useImperativeHandle(ref, () => ({ fire }));

  return <div ref={containerRef} className={styles.container} />;
});

PartyPopper.displayName = 'PartyPopper';