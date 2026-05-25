"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Wrench, Cpu, Users, BadgeCheck, MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { HeroCanvas } from "@/components/sections/HeroCanvas";
import { ScrollLinkedEngine } from "@/components/sections/ScrollLinkedEngine";
import { BookingForm } from "@/components/booking-form";
import Lenis from "lenis";

// Custom icons for heavy vehicles
const TruckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 17h4V5H2v12h3"/>
    <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h6Z"/>
    <path d="M14 17.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5Z"/>
    <path d="M5 17.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5Z"/>
  </svg>
);

const SprinterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2v-3.34a4 4 0 0 0-1.17-2.83L18 9h-4.26a1 1 0 0 0-.8.4L11.2 12H3V5h12v4"/>
        <path d="M3 17V5h12v4h4.43a2 2 0 0 1 1.76 1.05L22 13.5V17h-2"/>
        <path d="M7 17.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5Z"/>
        <path d="M17 17.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5Z"/>
    </svg>
);

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.75 13.96c.25.13.43.2.5.33.07.13.07.5.03.66a.87.87 0 0 1-.53.53c-1.83.6-4-.2-5.8-1.4-2.2-1.5-3.3-3.6-3.4-3.8-.2-.3-.5-.7-.5-1.1s.3-.7.5-.9c.2-.2.4-.3.6-.3s.4.1.6.3c.2.2.3.4.4.6.1.2.2.5.2.7.1.2 0 .4-.1.6-.1.1-1.3 1.5-1.3 1.5-.1.1-.1.3 0 .4s.3.2.4.2c.1 0 1.2-.5 2.1-1.3.8-.7 1.4-1.5 1.6-1.8.2-.3.3-.5.5-.5h.1c.2 0 .4.1.5.2m4.18-11.3C18.9.6 15.6.0 12 .0 5.4.0.1 5.4.1 12c0 2.1.6 4.1 1.6 5.8L0 24l6.4-1.7c1.6.9 3.5 1.4 5.6 1.4h.1c6.6 0 11.9-5.4 11.9-12 .1-3.6-.9-7-2.9-9.7z"/>
    </svg>
);

// Reusable Animated Section
function AnimatedSection({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  useEffect(() => {
    // Inicializamos Lenis SÓLO para la Landing Page
    const lenis = new Lenis({
      lerp: 0.1, // Suavidad
      syncTouch: false,
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      // Importante: al ir al dashboard se destruye y el scroll vuelve a ser normal
      lenis.destroy();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-clip">
      {/* Premium Glassmorphic Header */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-background/40 backdrop-blur-xl border-b border-white/5 transition-all">
        <Link href="/" className="flex items-center">
           <Image 
             src="/logo2.png" 
             alt="LionFix Service Logo" 
             width={120} 
             height={60} 
             className="h-16 w-auto object-contain" 
             priority
           />
        </Link>
        <nav className="hidden md:flex items-center gap-6">
            <Link href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Inicio</Link>
            <Link href="#about" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Nosotros</Link>
            <Link href="#services" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Servicios</Link>
            <Link href="#booking" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Agenda</Link>
            <Link href="#contact" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Contacto</Link>
        </nav>
        <Button className="rounded-full px-6 font-medium tracking-wide bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            <Link href="/login">Portal Clientes</Link>
        </Button>
      </header>

      <main className="flex-grow">
        {/* 3D Canvas Frame Sequence Engine */}
        <HeroCanvas />

        {/* 2. Por qué elegir LionFix (with video2.mp4 background) */}
        <section id="about" className="relative py-32 overflow-hidden border-y border-white/5">
           {/* Background Video */}
           <video 
              src="/videos/video2.mp4" 
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen"
           />
           {/* Dark Gradient Overlay */}
           <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20 pointer-events-none" />

           <div className="container mx-auto px-4 max-w-6xl relative z-10">
                 <AnimatedSection className="text-center mb-20">
                  <h2 className="text-4xl md:text-5xl font-headline font-bold text-white drop-shadow-xl">Por qué elegir LionFix Service</h2>
                  <p className="mt-4 text-xl text-white/80 max-w-2xl mx-auto font-light drop-shadow-lg">
                    Ingeniería de clase mundial y compromiso absoluto con la operatividad de tu negocio.
                  </p>
                </AnimatedSection>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    <AnimatedSection className="group">
                        <div className="mx-auto w-24 h-24 mb-8 bg-background/50 backdrop-blur-md border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-110 group-hover:-translate-y-2 duration-500">
                            <Users className="h-10 w-10 text-primary drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                        </div>
                        <h3 className="text-2xl font-headline font-bold text-white mb-4 drop-shadow-md">Técnicos de Élite</h3>
                        <p className="text-white/80 text-lg font-medium drop-shadow-md">Personal rigurosamente capacitado en tecnologías europeas.</p>
                    </AnimatedSection>
                    
                    <AnimatedSection className="group">
                        <div className="mx-auto w-24 h-24 mb-8 bg-background/50 backdrop-blur-md border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-110 group-hover:-translate-y-2 duration-500 delay-100">
                            <BadgeCheck className="h-10 w-10 text-primary drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                        </div>
                        <h3 className="text-2xl font-headline font-bold text-white mb-4 drop-shadow-md">Repuestos Premium</h3>
                        <p className="text-white/80 text-lg font-medium drop-shadow-md">Alianzas con proveedores de piezas originales y alternativas de alta gama.</p>
                    </AnimatedSection>

                    <AnimatedSection className="group">
                        <div className="mx-auto w-24 h-24 mb-8 bg-background/50 backdrop-blur-md border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-110 group-hover:-translate-y-2 duration-500 delay-200">
                            <ShieldCheck className="h-10 w-10 text-primary drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                        </div>
                        <h3 className="text-2xl font-headline font-bold text-white mb-4 drop-shadow-md">Garantía Total</h3>
                        <p className="text-white/80 text-lg font-medium drop-shadow-md">Transparencia absoluta en cada diagnóstico y reparación realizada.</p>
                    </AnimatedSection>
                </div>
            </div>
        </section>

        {/* 3. Interactive Scroll-Linked Engine Section (Services) */}
        <div id="services">
          <ScrollLinkedEngine />
        </div>

        {/* 4. Agendamiento (Booking) */}
        <section id="booking" className="py-24 relative bg-background border-t border-white/5">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none"></div>
            <div className="container mx-auto px-4 max-w-4xl relative z-10">
                 <AnimatedSection className="text-center mb-16">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Agendamiento Online</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-headline font-bold text-white drop-shadow-xl">Agenda tu Visita al Taller</h2>
                  <p className="mt-4 text-lg text-white/80 font-light">
                    Solicita una hora para mantención o tareas correctivas. Nos pondremos en contacto para confirmar tu cupo.
                  </p>
                </AnimatedSection>
                <AnimatedSection className="bg-card/40 backdrop-blur-md border border-border/50 p-8 md:p-10 rounded-3xl shadow-2xl">
                    <BookingForm />
                </AnimatedSection>
            </div>
        </section>

      </main>

      {/* Footer */}
      <footer id="contact" className="bg-background border-t border-white/10 pt-20 pb-10">
         <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                <div className="md:col-span-2">
                    <Link href="/" className="flex items-center mb-6">
                        <Image 
                          src="/logo2.png" 
                          alt="LionFix Service Logo" 
                          width={160} 
                          height={80} 
                          className="h-24 w-auto object-contain" 
                        />
                    </Link>
                    <p className="text-muted-foreground text-lg max-w-sm">
                        Ingeniería y precisión para mantener el motor de tu negocio siempre en marcha en la Región de Tarapacá.
                    </p>
                </div>
                <div>
                     <h3 className="text-lg font-headline font-bold text-white mb-6">Contacto</h3>
                     <ul className="space-y-4 text-muted-foreground font-light">
                        <li className="flex items-start gap-3 hover:text-white transition-colors cursor-pointer"><MapPin className="shrink-0 mt-1" size={18}/> Zona Franca, Manzana 5, Iquique, Chile</li>
                        <li className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer"><Phone size={18}/> +56 57 212 3456</li>
                        <li className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer"><Mail size={18}/> contacto@lionfix-iquique.cl</li>
                     </ul>
                </div>
                 <div>
                     <h3 className="text-lg font-headline font-bold text-white mb-6">Horario</h3>
                     <ul className="space-y-4 text-muted-foreground font-light">
                        <li className="flex justify-between border-b border-white/5 pb-2"><span>Lun - Vie</span> <span className="text-white">08:30 - 18:30</span></li>
                        <li className="flex justify-between border-b border-white/5 pb-2"><span>Sábado</span> <span className="text-white">09:00 - 14:00</span></li>
                        <li className="flex justify-between pb-2"><span>Domingo</span> <span className="text-primary">Cerrado</span></li>
                     </ul>
                </div>
            </div>
            <div className="border-t border-white/5 pt-8 text-center md:flex md:justify-between md:text-left text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} LionFix Service. Todos los derechos reservados.</p>
                <div className="mt-4 md:mt-0 space-x-6">
                    <Link href="#" className="hover:text-white transition-colors">Términos de Servicio</Link>
                    <Link href="#" className="hover:text-white transition-colors">Privacidad</Link>
                </div>
            </div>
         </div>
      </footer>

    </div>
  );
}
