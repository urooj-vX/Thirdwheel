'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface EditorialStorySectionProps {
  onGetStarted: () => void;
  isSeeding: boolean;
}

const STORY_LINES = [
  'You remember the person.',
  'You remember the conversation.',
  'But sometimes, the details disappear.',
  'Memory gets messy.',
  'So keep the receipts.',
  'Not the assumptions.',
];

export function EditorialStorySection({ onGetStarted, isSeeding }: EditorialStorySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const finalBlockRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const doodleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      lineRefs.current.forEach((line) => {
        if (line) line.style.color = '#18181B';
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Story lines color transition on scroll
      lineRefs.current.forEach((line) => {
        if (!line) return;

        gsap.to(line, {
          color: '#18181B',
          duration: 0.4,
          ease: 'power1.inOut',
          scrollTrigger: {
            trigger: line,
            start: 'top 50%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      // 2. Final tagline & button fade up (using gsap.from() so default CSS is 100% visible)
      if (finalBlockRef.current) {
        const finalTl = gsap.timeline({
          scrollTrigger: {
            trigger: finalBlockRef.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        });

        if (taglineRef.current) {
          finalTl.from(taglineRef.current, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            ease: 'power2.out',
          });
        }

        if (buttonRef.current) {
          finalTl.from(
            buttonRef.current,
            {
              opacity: 0,
              y: 20,
              duration: 0.6,
              ease: 'power2.out',
            },
            '-=0.3'
          );
        }
      }

      // 3. Gentle Idle Sway Animation for Swing Doodle (-3deg to 3deg, 4s cycle)
      if (doodleRef.current) {
        gsap.fromTo(
          doodleRef.current,
          { rotate: -3 },
          {
            rotate: 3,
            duration: 2,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            transformOrigin: 'top center',
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-[#F8F6F1] text-[#18181B] pt-[40vh] pb-[40vh] px-6 md:px-16 lg:px-24 select-none overflow-visible"
    >
      <div
        className="max-w-5xl mx-auto flex flex-col"
        style={{ '--line-gap': '2rem', gap: 'var(--line-gap)' } as React.CSSProperties}
      >
        {/* Story H2 Lines */}
        {STORY_LINES.map((text, idx) => (
          <h2
            key={idx}
            ref={(el) => {
              lineRefs.current[idx] = el;
            }}
            className="font-serif text-[clamp(2.2rem,5.5vw,4.5rem)] font-medium leading-[1.1] tracking-tight text-[#A8A29E] transition-colors duration-300"
          >
            {text}
          </h2>
        ))}

        {/* Final Emotional Closing Section */}
        <div
          ref={finalBlockRef}
          className="mt-32 p-8 sm:p-12 md:p-16 rounded-3xl flex flex-col items-center text-center gap-8 md:gap-10 transition-colors shadow-xs"
          style={{ '--color-warm': '#FEF8E0', backgroundColor: 'var(--color-warm)' } as React.CSSProperties}
        >
          {/* 1. Large Hands Illustration */}
          <div className="w-full max-w-[720px] mx-auto">
            <img
              src="/illustrations/hands.svg"
              alt="Hands coming together"
              className="w-full h-auto object-contain mx-auto select-none pointer-events-none"
              style={{ width: 'min(100%, 720px)' }}
            />
          </div>

          {/* 2. Emotional Closing Copy */}
          <p
            ref={taglineRef}
            className="font-serif text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-[#18181B] max-w-xl mx-auto leading-snug"
          >
            Because the conversations we forget<br />
            <span className="italic text-[#78716C] font-normal">
              can still matter.
            </span>
          </p>

          {/* 3. Single GET STARTED CTA */}
          <div ref={buttonRef} className="pt-2">
            <button
              onClick={onGetStarted}
              disabled={isSeeding}
              className="rounded-full border border-[#18181B] bg-[#18181B] hover:bg-[#C85A32] hover:border-[#C85A32] px-10 py-4 text-xs font-sans font-medium uppercase tracking-wider text-[#F8F6F1] transition shadow-xs hover:scale-[1.02] inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{isSeeding ? 'Loading app...' : 'GET STARTED →'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


