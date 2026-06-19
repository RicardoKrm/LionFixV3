"use client";

export function HeroCanvas() {
  return (
    <section className="relative w-full h-screen bg-[#000000] z-10 overflow-hidden">
      
      {/* The Background Video */}
      <video 
        src="/videos/video1.mp4" 
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      />

      {/* Dark Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-transparent pointer-events-none" />
      
      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none z-20">
         <div className="max-w-4xl mt-16"> {/* mt-16 to offset the fixed header */}
            <h1 className="text-4xl md:text-7xl font-headline font-bold text-primary tracking-tighter drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] mb-4 leading-tight">
                LionFix Service Iquique
            </h1>
            <h2 className="text-2xl md:text-4xl font-headline font-semibold text-white tracking-tight drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)] mb-6">
                Especialistas en Mercedes-Benz
            </h2>
            <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] font-light">
                Precisión técnica, experiencia real y servicio especializado para toda la línea Mercedes.
            </p>
         </div>
      </div>

    </section>
  );
}
