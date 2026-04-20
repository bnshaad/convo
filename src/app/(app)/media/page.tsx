'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useChatStore, MediaItem } from '@/store/useChatStore';
import { ArrowLeft, X, ChevronLeft, ChevronRight, Play, Check } from 'lucide-react';
import { NbButton } from '@/components/ui/NbButton';
import { NbCard } from '@/components/ui/NbCard';
import { NbSkeleton } from '@/components/ui/NbSkeleton';

type TabType = 'Images' | 'Videos' | 'Files';

export default function MediaPage() {
  const router = useRouter();
  const { media } = useChatStore();
  const [activeTab, setActiveTab] = useState<TabType>('Images');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredMedia = media.filter(item => {
    if (activeTab === 'Images') return item.type === 'image';
    if (activeTab === 'Videos') return item.type === 'video';
    if (activeTab === 'Files') return item.type === 'file';
    return false;
  });

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleTileClick = (index: number) => {
    const item = filteredMedia[index];
    if (item.type === 'image') {
      setLightboxIndex(index);
    }
  };

  const closeLightbox = () => setLightboxIndex(null);

  const navigateLightbox = (dir: 'next' | 'prev') => {
    if (lightboxIndex === null) return;
    if (dir === 'next') {
      setLightboxIndex((lightboxIndex + 1) % filteredMedia.length);
    } else {
      setLightboxIndex((lightboxIndex - 1 + filteredMedia.length) % filteredMedia.length);
    }
  };

  return (
    <div className="min-h-screen bg-nb-cream text-nb-black flex flex-col relative">
      
      {/* Header */}
      <header className="bg-nb-black border-b-[3px] border-nb-black px-4 py-4 flex items-center shrink-0 z-30 relative">
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        >
          <ArrowLeft className="text-white w-7 h-7" strokeWidth={3} />
        </button>
        <h1 className="font-black text-[18px] text-white uppercase tracking-wide w-full text-center px-12">
          Media
        </h1>
      </header>

      {/* Tab Row */}
      <div className="bg-white border-b-[2px] border-nb-black flex shrink-0">
        {(['Images', 'Videos', 'Files'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-[14px] uppercase tracking-widest transition-all ${
              activeTab === tab
              ? 'bg-nb-yellow border-b-[4px] border-nb-black font-black'
              : 'text-nb-black/50 font-medium hover:text-nb-black hover:bg-nb-cream/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid Content */}
      <main className="flex-1 overflow-y-auto p-[3px]">
        <div className="grid grid-cols-3 gap-[3px]">
          {isLoading ? (
            // Skeleton Grid
            Array.from({ length: 12 }).map((_, i) => (
              <NbSkeleton key={i} className="aspect-square border-[2px] border-nb-black" />
            ))
          ) : filteredMedia.map((item, idx) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div 
                key={item.id}
                onClick={() => handleTileClick(idx)}
                className={`relative aspect-square cursor-pointer overflow-hidden transition-all ${
                  isSelected 
                  ? 'border-[4px] border-nb-mint z-10' 
                  : 'border-[2px] border-nb-black'
                }`}
              >
                {/* Media Content */}
                {item.type === 'image' && (
                  <Image 
                    src={item.url} 
                    alt="Media content" 
                    fill 
                    className="object-cover" 
                  />
                )}
                {item.type === 'video' && (
                  <div className="w-full h-full bg-nb-black relative">
                    {item.thumbnail && (
                      <Image 
                        src={item.thumbnail} 
                        alt="Video thumbnail" 
                        fill 
                        className="object-cover opacity-60" 
                      />
                    )}
                    {/* Yellow Play Badge */}
                    <div className="absolute top-1 right-1 bg-nb-yellow border-[2px] border-nb-black p-1 shadow-[2px_2px_0px_#0D0D0D]">
                      <Play className="w-3 h-3 fill-nb-black" />
                    </div>
                  </div>
                )}
                {item.type === 'file' && (
                  <div className="w-full h-full bg-nb-black flex items-center justify-center">
                    <span className="text-white font-black text-[18px] uppercase tracking-tighter">
                      {item.extension}
                    </span>
                  </div>
                )}

                {/* Selection Overlay Checkbox */}
                <button
                  onClick={(e) => toggleSelection(e, item.id)}
                  className="absolute bottom-1 right-1 w-6 h-6 border-[2px] border-nb-black bg-white flex items-center justify-center shadow-[2px_2px_0px_#0D0D0D] z-20 transition-all hover:shadow-[3px_3px_0px_#0D0D0D] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-0 active:translate-y-0 active:shadow-none"
                >
                   {isSelected && <Check className="w-4 h-4 text-nb-mint" strokeWidth={4} />}
                </button>

                {/* Selected Badge Top-Left Overlay */}
                {isSelected && (
                  <div className="absolute top-1 left-1 bg-nb-yellow border-[2px] border-nb-black p-1 z-20 shadow-[2px_2px_0px_#0D0D0D]">
                     <Check className="w-3 h-3 text-nb-black" strokeWidth={4} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {filteredMedia.length === 0 && (
          <div className="py-20 text-center opacity-30 font-bold uppercase tracking-widest">
            No {activeTab.toLowerCase()} found
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-6 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 w-12 h-12 bg-nb-black border-[2.5px] border-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-[110]"
          >
            <X className="text-white w-7 h-7" strokeWidth={3} />
          </button>

          {/* Nav Buttons */}
          <button
            onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
            className="absolute left-6 w-14 h-14 bg-white border-[3px] border-nb-black flex items-center justify-center shadow-[4px_4px_0px_#0D0D0D] transition-all hover:shadow-[6px_6px_0px_#0D0D0D] hover:-translate-x-[2px] hover:-translate-y-[2px] active:translate-x-1 active:translate-y-1 active:shadow-none z-[110]"
          >
            <ChevronLeft className="w-8 h-8" strokeWidth={3} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
            className="absolute right-6 w-14 h-14 bg-white border-[3px] border-nb-black flex items-center justify-center shadow-[4px_4px_0px_#0D0D0D] transition-all hover:shadow-[6px_6px_0px_#0D0D0D] hover:-translate-x-[2px] hover:-translate-y-[2px] active:translate-x-1 active:translate-y-1 active:shadow-none z-[110]"
          >
            <ChevronRight className="w-8 h-8" strokeWidth={3} />
          </button>

          {/* Image Container */}
          <div 
            className="relative w-full max-w-2xl aspect-square"
            onClick={(e) => e.stopPropagation()}
          >
             <NbCard className="w-full h-full p-0 overflow-hidden !border-[4px] shadow-[8px_8px_0px_#0D0D0D]">
                <Image 
                  src={filteredMedia[lightboxIndex].url} 
                  alt="Lightbox content" 
                  fill 
                  className="object-contain" 
                />
             </NbCard>
          </div>
        </div>
      )}
    </div>
  );
}
