'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HERO_MOTION_CONFIG } from '@/config/hero-motion';

interface AwwwardsHeroProps {
  onGetStarted?: () => void;
  isSeeding?: boolean;
}

export function AwwwardsHero({ onGetStarted, isSeeding }: AwwwardsHeroProps = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      if (wordmarkRef.current) gsap.set(wordmarkRef.current, { opacity: 1, y: 0 });
      if (copyRef.current) gsap.set(copyRef.current, { opacity: 1, y: 0 });
      if (imageRef.current) gsap.set(imageRef.current, { opacity: 1, y: 0 });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const loadTl = gsap.timeline({
        defaults: { ease: 'power2.out' },
      });

      if (wordmarkRef.current) {
        loadTl.fromTo(
          wordmarkRef.current,
          { opacity: 0, y: -15 },
          { opacity: 1, y: 0, duration: 0.7 }
        );
      }

      if (copyRef.current) {
        loadTl.fromTo(
          copyRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.3'
        );
      }

      if (imageRef.current) {
        loadTl.fromTo(
          imageRef.current,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
          '-=0.3'
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[90vh] flex flex-col items-center justify-between py-12 md:py-16 px-4 md:px-8 transition-colors overflow-hidden select-none"
      style={{ backgroundColor: HERO_MOTION_CONFIG.colors.bgHero }}
    >
      <div className="w-full max-w-[1280px] mx-auto flex flex-col items-center justify-center text-center my-auto">
        {/* 1. Dominant THIRD WHEEL Wordmark Graphic */}
        <div ref={wordmarkRef} className="w-full max-w-[750px] mx-auto pt-4">
          <img
            src={HERO_MOTION_CONFIG.assets.wordmark}
            alt="THIRD WHEEL"
            className="w-full h-auto object-contain mx-auto select-none pointer-events-none"
          />
        </div>

        {/* 2-4. Hero Copy (Spacious editorial text) */}
        <div ref={copyRef} className="mt-8 md:mt-10 max-w-2xl mx-auto space-y-4">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#18181B] leading-tight">
            Remember what happened.
          </h1>

          <p className="font-serif text-xl sm:text-2xl md:text-3xl text-[#78716C] italic font-normal underline decoration-[#C85A32]/30 underline-offset-4">
            Not what you think happened.
          </p>

          <p className="font-sans text-sm sm:text-base text-[#78716C] max-w-md mx-auto pt-1 leading-relaxed">
            A private memory companion for the conversations that matter.
          </p>
        </div>

        {/* 6. Wide Family Group Illustration Banner BELOW Wordmark & Copy */}
        <div ref={imageRef} className="w-full max-w-[1100px] mx-auto mt-10 md:mt-14 px-2 sm:px-4">
          <img
            src="/illustrations/family.svg"
            alt="People and conversations in our lives"
            className="w-full h-auto object-contain mx-auto select-none pointer-events-none"
            style={{ width: 'min(100%, 1100px)' }}
          />
        </div>
      </div>
    </section>
  );
}


