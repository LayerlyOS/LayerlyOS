'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 0.1,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; transform: string }>({
    top: 0,
    left: 0,
    transform: '',
  });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on scroll to prevent detached tooltips
  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) setIsVisible(false);
    };
    window.addEventListener('scroll', handleScroll, { capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [isVisible]);

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;
    let transform = '';

    // Basic position calculation
    if (position === 'top') {
      top = rect.top - gap;
      left = rect.left + rect.width / 2;
      transform = 'translate(-50%, -100%)';
    } else if (position === 'bottom') {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2;
      transform = 'translate(-50%, 0)';
    } else if (position === 'left') {
      top = rect.top + rect.height / 2;
      left = rect.left - gap;
      transform = 'translate(-100%, -50%)';
    } else if (position === 'right') {
      top = rect.top + rect.height / 2;
      left = rect.right + gap;
      transform = 'translate(0, -50%)';
    }

    // Smart edge detection (prevents clipping)
    if (position === 'top' || position === 'bottom') {
      const windowWidth = window.innerWidth;

      // If too close to left edge
      if (rect.left < 100) {
        left = rect.left;
        transform = position === 'top' ? 'translate(0, -100%)' : 'translate(0, 0)';
      }
      // If too close to right edge
      else if (rect.right > windowWidth - 100) {
        left = rect.right;
        transform = position === 'top' ? 'translate(-100%, -100%)' : 'translate(-100%, 0)';
      }
    }

    setCoords({ top, left, transform });
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsVisible(true);
  };

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Tooltip wrapper needs to handle events */}
      <span
        ref={triggerRef}
        className={`relative inline-flex items-center ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => {
          if (!isVisible) updatePosition();
          setIsVisible(!isVisible);
        }}
      >
        {children}
      </span>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isVisible && content && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, delay }}
                style={{
                  position: 'fixed',
                  top: coords.top,
                  left: coords.left,
                  transform: coords.transform,
                  zIndex: 9999,
                }}
                className="px-3 py-2 text-xs leading-relaxed font-medium text-white bg-slate-800 rounded-lg shadow-xl w-max max-w-[220px] text-center pointer-events-none"
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
