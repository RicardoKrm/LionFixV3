"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Wrench, Cpu, ShieldCheck, Cog } from "lucide-react";

export function ScrollLinkedEngine() {
  // Contenedor principal que forzará el scroll (muy alto)
  const containerRef = useRef<HTMLDivElement>(null);

  // Progreso del scroll dentro del contenedor (0 = arriba, 1 = abajo)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Animaciones basadas en el progreso del scroll:
  
  // 1. Posición del motor en X (de -100% a 100% es relativo a su propio tamaño)
  // 0.0 -> 0.2: Centro
  // 0.2 -> 0.4: Se mueve a la derecha (para mostrar info a la izquierda)
  // 0.4 -> 0.6: Se mantiene a la derecha
  // 0.6 -> 0.8: Se mueve a la izquierda (cruzando el centro, revelando info a la derecha)
  // 0.8 -> 1.0: Se mantiene a la izquierda
  const motorX = useTransform(scrollYProgress, 
    [0, 0.2, 0.4, 0.6, 0.8, 1], 
    ["0%", "0%", "35%", "35%", "-35%", "-35%"]
  );

  // Escala opcional para dar un efecto de acercamiento
  const motorScale = useTransform(scrollYProgress,
    [0, 0.2, 0.4, 1],
    [1, 1, 1.1, 1.1]
  );

  // 2. Opacidad del panel IZQUIERDO (visible cuando motor a la derecha)
  const leftOpacity = useTransform(scrollYProgress, 
    [0.2, 0.4, 0.55, 0.65], 
    [0, 1, 1, 0]
  );
  
  const leftY = useTransform(scrollYProgress, 
    [0.2, 0.4], 
    [50, 0]
  );

  // 3. Opacidad del panel DERECHO (visible cuando motor a la izquierda)
  const rightOpacity = useTransform(scrollYProgress, 
    [0.65, 0.8, 1], 
    [0, 1, 1]
  );

  const rightY = useTransform(scrollYProgress, 
    [0.65, 0.8], 
    [50, 0]
  );

  return (
    <section ref={containerRef} className="relative w-full h-[300vh] bg-background">
      {/* Contenedor Fijo: Se queda pegado a la pantalla mientras el usuario hace scroll */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-secondary/10 to-background">
        
        {/* LA IMAGEN O VIDEO DEL MOTOR */}
        <motion.div 
          style={{ x: motorX, scale: motorScale }}
          className="absolute z-10 w-full max-w-[800px] aspect-video flex items-center justify-center"
        >
          {/* Aquí el cliente pondrá su video o imagen. Usamos un placeholder impactante por ahora */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-secondary/30">
            <video 
              src="/videos/video3.mp4" 
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover mix-blend-luminosity opacity-80"
            />
            {/* Overlay para contraste */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          </div>
        </motion.div>

        {/* PANEL IZQUIERDO: Información */}
        <motion.div 
          style={{ opacity: leftOpacity, y: leftY }}
          className="absolute left-[5%] md:left-[10%] max-w-sm z-20"
        >
          <div className="bg-background/80 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl space-y-8">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-4">
                <Cog className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold font-headline mb-2">Especialistas MB Sprinter</h3>
              <p className="text-muted-foreground text-base">
                Conocemos cada milímetro de tu Sprinter. Software oficial y repuestos certificados.
              </p>
            </div>
            
            <div className="h-px w-full bg-border"></div>

            <div>
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-4">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold font-headline mb-2">Scanner Avanzado</h3>
              <p className="text-muted-foreground text-base">
                Detección electrónica de fallas con precisión milimétrica.
              </p>
            </div>
          </div>
        </motion.div>

        {/* PANEL DERECHO: Información */}
        <motion.div 
          style={{ opacity: rightOpacity, y: rightY }}
          className="absolute right-[5%] md:right-[10%] max-w-sm z-20"
        >
          <div className="bg-background/80 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl space-y-8">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-4">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold font-headline mb-2">Motores Diesel</h3>
              <p className="text-muted-foreground text-base">
                Expertos en sistemas Common Rail y ajuste de motores pesados.
              </p>
            </div>
            
            <div className="h-px w-full bg-border"></div>

            <div>
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold font-headline mb-2">Flotas Completas</h3>
              <p className="text-muted-foreground text-base">
                Planes preventivos para que tu negocio en Iquique no se detenga jamás.
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
