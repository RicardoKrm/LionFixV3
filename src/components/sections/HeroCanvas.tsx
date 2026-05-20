"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 100;
const FRAME_PREFIX = "frame_";
const FRAME_EXTENSION = ".jpg";
const FRAMES_DIR = "/frames/";

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tickingRef = useRef(false);
  
  const [loaded, setLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Store preloaded images
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // Preload images
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      const paddedIndex = i.toString().padStart(4, "0");
      img.src = `${FRAMES_DIR}${FRAME_PREFIX}${paddedIndex}${FRAME_EXTENSION}`;
      
      img.onload = () => {
        loadedCount++;
        setLoadProgress(Math.floor((loadedCount / FRAME_COUNT) * 100));
        if (loadedCount === FRAME_COUNT) {
          setLoaded(true);
        }
      };
      
      // Fallback in case an image fails to load
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === FRAME_COUNT) {
          setLoaded(true); // Still proceed if some frames are missing
        }
      };

      images.push(img);
    }
    imagesRef.current = images;
  }, []);

  // Draw frame function
  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const img = imagesRef.current[frameIndex];
    if (!img || !img.complete) return;

    // DPR-aware sizing
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Cover fit logic (like object-fit: cover)
    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;
    
    let drawWidth = canvas.width;
    let drawHeight = canvas.height;
    let offsetX = 0;
    let offsetY = 0;

    // Mobile zoom out factor to ensure it reads well
    const scaleFactor = window.innerWidth < 768 ? 1.3 : 1;

    if (imgRatio > canvasRatio) {
      drawWidth = canvas.height * imgRatio * scaleFactor;
      drawHeight = canvas.height * scaleFactor;
      offsetX = (canvas.width - drawWidth) / 2;
      offsetY = (canvas.height - drawHeight) / 2;
    } else {
      drawWidth = canvas.width * scaleFactor;
      drawHeight = (canvas.width / imgRatio) * scaleFactor;
      offsetX = (canvas.width - drawWidth) / 2;
      offsetY = (canvas.height - drawHeight) / 2;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };

  // Scroll listener
  useEffect(() => {
    if (!loaded) return;

    // Draw initial frame
    drawFrame(0);

    const handleScroll = () => {
      if (!tickingRef.current) {
        requestAnimationFrame(() => {
          const container = containerRef.current;
          if (!container) return;

          const rect = container.getBoundingClientRect();
          
          // Calculate progress from 0 to 1
          // Progress starts when top of container hits top of viewport
          const scrollDistance = container.offsetHeight - window.innerHeight;
          let progress = -rect.top / scrollDistance;
          
          // Clamp progress
          progress = Math.max(0, Math.min(1, progress));

          // Calculate frame index
          const frameIndex = Math.floor(progress * (FRAME_COUNT - 1));
          
          drawFrame(frameIndex);
          
          tickingRef.current = false;
        });
        tickingRef.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Handle resize
    const handleResize = () => drawFrame(0);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [loaded]);

  return (
    <section ref={containerRef} style={{ height: "400vh" }} className="relative bg-[#000000] z-10">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        
        {/* The Canvas */}
        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-cover" 
          style={{ width: '100%', height: '100%' }}
        />

        {/* Loading Bar */}
        {!loaded && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#000000] text-white">
            <h2 className="font-headline text-2xl mb-4 font-bold tracking-tighter">Inicializando Motor 3D</h2>
            <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300" 
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <p className="mt-2 text-white/50 text-sm font-mono">{loadProgress}%</p>
          </div>
        )}

        {/* Dark Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/20 to-transparent pointer-events-none" />
        
        {/* Annotation Text Overlay */}
        <div className="absolute top-[15%] left-0 w-full px-6 flex justify-center pointer-events-none">
           <div className="text-center max-w-4xl">
              <h1 className="text-4xl md:text-6xl font-headline font-bold text-primary tracking-tighter drop-shadow-2xl mb-2 leading-tight">
                  LionFix Iquique
              </h1>
              <h2 className="text-2xl md:text-4xl font-headline font-semibold text-white tracking-tight drop-shadow-xl mb-4">
                  Especialistas en Mercedes-Benz
              </h2>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto drop-shadow-lg font-light">
                  Precisión técnica, experiencia real y servicio especializado para toda la línea Mercedes.
              </p>
           </div>
        </div>

      </div>
    </section>
  );
}
