'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NbButton } from '@/components/ui/NbButton';
import { useAuthStore } from '@/store/useAuthStore';

const HandshakeSvg = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="var(--nb-black)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 65 L40 75 V40 L15 30 Z" fill="#00C2CC" />
    <path d="M85 65 L60 75 V40 L85 30 Z" fill="#FF4B3E" />
    <path d="M40 75 V55 L60 40 V60 Z" fill="#00C2CC" />
    <path d="M60 75 V55 L40 40 V60 Z" fill="#FF4B3E" />
    <rect x="40" y="50" width="10" height="10" fill="#00C2CC" />
    <rect x="50" y="50" width="10" height="10" fill="#FF4B3E" />
  </svg>
);

const LockSvg = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full p-2" fill="none" stroke="var(--nb-black)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="25" y="45" width="50" height="40" fill="#2563FF" />
    <path d="M35 45 V30 A15 15 0 0 1 65 30 V45" />
    <rect x="45" y="60" width="10" height="10" fill="var(--nb-cream)" />
    <path d="M50 70 V75" stroke="var(--nb-cream)" strokeWidth="4" />
  </svg>
);

const ChatSvg = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full p-2" fill="none" stroke="var(--nb-black)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M80 50 V30 H20 V65 H40" />
    <path d="M25 35 H75 V70 H45 L25 85 V70 Z" fill="#00C86A" />
    <rect x="36" y="48" width="8" height="8" fill="var(--nb-black)" />
    <rect x="46" y="48" width="8" height="8" fill="var(--nb-black)" />
    <rect x="56" y="48" width="8" height="8" fill="var(--nb-black)" />
  </svg>
);

const slides = [
  {
    bubbleColor: '#00C2CC',
    bubbleText: 'WELCOME',
    illustration: HandshakeSvg,
    heading: 'Stay Connected',
    subtext: 'Connect with friends and family.',
  },
  {
    bubbleColor: '#7C3AED',
    bubbleText: 'FAST & SECURE',
    illustration: LockSvg,
    heading: 'Your privacy first',
    subtext: 'End-to-end encrypted messages.',
  },
  {
    bubbleColor: '#FF4B3E',
    bubbleText: 'GET STARTED',
    illustration: ChatSvg,
    heading: 'Chat instantly',
    subtext: 'No delays, no limits.',
  }
];

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const { user } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  // Check if user is a guest
  const isGuest = user?.id?.startsWith('guest-');
  const activeSlides = isGuest ? [slides[0]] : slides;

  useEffect(() => {
    // Check if user has already onboarded
    const hasOnboarded = localStorage.getItem('neo_onboarded');
    if (hasOnboarded === 'true') {
      router.replace('/chats');
    } else {
      setIsReady(true);
    }
  }, [router]);

  const handleNext = () => {
    if (currentSlide === activeSlides.length - 1) {
      localStorage.setItem('neo_onboarded', 'true');
      router.push('/chats');
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  if (!isReady) {
    return <div className="min-h-screen bg-nb-cream flex items-center justify-center font-black uppercase tracking-widest text-nb-black/20">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-nb-cream flex flex-col justify-between overflow-hidden isolate relative">
      {/* Background Section Split */}
      <div className="absolute top-0 left-0 w-full h-[55%] bg-nb-yellow border-b-[3px] border-nb-black -z-10" />
      
      <div className="flex-1 w-full flex flex-col items-center justify-center p-4 py-8 pt-16">
        
        {/* Slider Track Overflow Wrapper */}
        <div className="w-full max-w-[380px] overflow-hidden p-2 -mx-2">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {activeSlides.map((slide, idx) => {
              const SvgIcon = slide.illustration;
              return (
                <div key={idx} className="min-w-full px-2 pt-6">
                  {/* Card Container */}
                  <div className="relative bg-nb-card border-[3px] border-nb-black shadow-[5px_5px_0px_var(--nb-black)] flex flex-col p-6 pb-8 min-h-[460px]">
                    
                    {/* Floating Speech Bubble */}
                    <div 
                      className="absolute -top-[24px] left-6 border-[3px] border-nb-black shadow-[4px_4px_0px_var(--nb-black)] px-6 py-2.5 z-10"
                      style={{ backgroundColor: slide.bubbleColor }}
                    >
                      <span className="font-black text-white text-[20px] uppercase tracking-wider block translate-y-[1px]">
                        {slide.bubbleText}
                      </span>
                      {/* CSS Triangle Tail */}
                      <div 
                        className="absolute -bottom-[9.5px] left-8 w-[15px] h-[15px] border-b-[3px] border-r-[3px] border-nb-black transform rotate-45 z-10"
                        style={{ backgroundColor: slide.bubbleColor }}
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center mt-8">
                      {/* Illustration Box */}
                      <div className="bg-nb-cream border-[3px] border-nb-black mb-8 aspect-[5/4] flex items-center justify-center p-6 relative overflow-hidden">
                        <SvgIcon />
                      </div>
                      
                      <h2 className="font-black text-[32px] text-nb-black uppercase tracking-tight leading-none mb-3">
                        {slide.heading}
                      </h2>
                      <p className="font-bold text-nb-black/70 text-[17px] leading-snug">
                        {slide.subtext}
                      </p>
                    </div>

                    {/* Dots Row - only show if more than 1 slide */}
                    {activeSlides.length > 1 && (
                      <div className="flex items-center gap-3 mt-10">
                        {activeSlides.map((_, dotIdx) => (
                          <button 
                            key={dotIdx}
                            onClick={() => setCurrentSlide(dotIdx)}
                            className={`w-[17px] h-[17px] border-[3px] border-nb-black transition-colors ${dotIdx === currentSlide ? 'bg-nb-coral' : 'bg-white'}`}
                            aria-label={`Go to slide ${dotIdx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Absolute Bottom Button Container */}
      <div className="w-full max-w-[380px] mx-auto px-4 pb-10 shrink-0">
        <NbButton variant="primary" className="w-full py-[18px] text-[17px]" onClick={handleNext}>
          {currentSlide === activeSlides.length - 1 ? 'GET STARTED' : 'NEXT'}
        </NbButton>
      </div>
    </div>
  );
}
