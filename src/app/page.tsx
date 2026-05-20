"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Wrench, Cpu, Users, BadgeCheck, MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { HeroCanvas } from "@/components/sections/HeroCanvas";

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
            <Link href="#services" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Servicios</Link>
            <Link href="#about" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Nosotros</Link>
            <Link href="#contact" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Contacto</Link>
        </nav>
        <Button className="rounded-full px-6 font-medium tracking-wide bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            <Link href="/login">Portal Clientes</Link>
        </Button>
      </header>

      <main className="flex-grow">
        {/* 3D Canvas Frame Sequence Engine */}
        <HeroCanvas />

        {/* Bento Grid Services Section */}
        <section id="services" className="py-32 bg-background relative z-10 px-4 md:px-8 max-w-[1400px] mx-auto">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tight">Precisión Neumática. <br/>Ingeniería de Clase Mundial.</h2>
            <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto font-light">
              Desde diagnóstico por computadora hasta reparaciones profundas de motores diésel.
            </p>
          </AnimatedSection>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
            {/* Bento Box 1 - Large */}
            <AnimatedSection className="md:col-span-2 bg-card border border-white/5 rounded-[32px] p-10 flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 transition-colors shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-6">
                  <SprinterIcon className="h-8 w-8" />
                </div>
                <h3 className="text-3xl font-headline font-bold text-white mb-3">Especialistas MB Sprinter</h3>
                <p className="text-muted-foreground text-lg max-w-md">
                  Conocemos cada milímetro de tu Sprinter. Utilizamos software oficial y repuestos certificados para garantizar su durabilidad.
                </p>
              </div>
            </AnimatedSection>

            {/* Bento Box 2 */}
            <AnimatedSection className="bg-card border border-white/5 rounded-[32px] p-10 flex flex-col justify-between relative overflow-hidden group hover:border-white/20 transition-colors shadow-xl">
               <div className="relative z-10">
                <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center text-white mb-6">
                  <Cpu className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-headline font-bold text-white mb-3">Scanner Avanzado</h3>
                <p className="text-muted-foreground text-lg">
                  Detección electrónica de fallas con precisión milimétrica.
                </p>
              </div>
            </AnimatedSection>

            {/* Bento Box 3 */}
            <AnimatedSection className="bg-card border border-white/5 rounded-[32px] p-10 flex flex-col justify-between relative overflow-hidden group hover:border-white/20 transition-colors shadow-xl">
               <div className="relative z-10">
                <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center text-white mb-6">
                  <Wrench className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-headline font-bold text-white mb-3">Motores Diesel</h3>
                <p className="text-muted-foreground text-lg">
                  Expertos en sistemas Common Rail y ajuste de motores pesados.
                </p>
              </div>
            </AnimatedSection>

            {/* Bento Box 4 - Large Horizontal */}
            <AnimatedSection className="md:col-span-2 bg-gradient-to-r from-card to-background border border-white/5 rounded-[32px] p-10 flex flex-col justify-center relative overflow-hidden group hover:border-primary/30 transition-colors shadow-xl">
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="h-20 w-20 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <TruckIcon className="h-10 w-10" />
                </div>
                <div>
                    <h3 className="text-3xl font-headline font-bold text-white mb-3">Mantenimiento de Flotas Completas</h3>
                    <p className="text-muted-foreground text-lg">
                    No importa si tienes 1 o 50 vehículos. Creamos planes preventivos para que tu negocio en Iquique no se detenga jamás.
                    </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
        
        {/* Feature Highlights with 3D Float Effect */}
        <section id="about" className="py-32 bg-card/30 border-y border-white/5 relative overflow-hidden">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
             
             <div className="container mx-auto px-4 max-w-6xl relative z-10">
                 <AnimatedSection className="text-center mb-20">
                  <h2 className="text-4xl md:text-5xl font-headline font-bold text-white">Por qué elegir LionFix</h2>
                </AnimatedSection>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    <AnimatedSection className="group">
                        <div className="mx-auto w-24 h-24 mb-8 bg-background border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-110 group-hover:-translate-y-2 duration-500">
                            <Users className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-headline font-bold text-white mb-4">Técnicos de Élite</h3>
                        <p className="text-muted-foreground text-lg">Personal rigurosamente capacitado en tecnologías europeas.</p>
                    </AnimatedSection>
                    
                    <AnimatedSection className="group">
                        <div className="mx-auto w-24 h-24 mb-8 bg-background border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-110 group-hover:-translate-y-2 duration-500 delay-100">
                            <BadgeCheck className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-headline font-bold text-white mb-4">Repuestos Premium</h3>
                        <p className="text-muted-foreground text-lg">Alianzas con proveedores de piezas originales y alternativas de alta gama.</p>
                    </AnimatedSection>

                    <AnimatedSection className="group">
                        <div className="mx-auto w-24 h-24 mb-8 bg-background border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-110 group-hover:-translate-y-2 duration-500 delay-200">
                            <ShieldCheck className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-headline font-bold text-white mb-4">Garantía Total</h3>
                        <p className="text-muted-foreground text-lg">Transparencia absoluta en cada diagnóstico y reparación realizada.</p>
                    </AnimatedSection>
                </div>
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
