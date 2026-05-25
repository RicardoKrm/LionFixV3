"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { User, Lock, ShieldCheck, Zap, BarChart3, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      if (user.role === 'admin') router.push('/dashboard');
      else if (user.role === 'mechanic') router.push('/mechanic/dashboard');
      else router.push('/portal/dashboard');
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Redirigiendo a tu panel...",
      });
      // La redirección ocurre en el AuthProvider
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de Autenticación",
        description: (error as Error).message,
      });
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-background font-sans text-foreground">
      {/* LEFT COLUMN: LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-16 justify-center max-w-xl mx-auto lg:mx-0 lg:max-w-none relative z-10">
        
        {/* Top Logo */}
        <div className="absolute top-8 left-8 lg:top-12 lg:left-16 flex items-center gap-3">
          <Image
            src="/logo2.png"
            alt="LionFix Service Logo"
            width={50}
            height={50}
            className="w-12 h-auto drop-shadow-[0_0_12px_rgba(202,162,0,0.5)]"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block">LionFix Service</span>
        </div>

        <div className="mt-12 lg:mt-0 w-full max-w-[420px] mx-auto">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
            Bienvenido a LionFix Service
          </h1>
          <p className="text-muted-foreground text-base mb-8">
            Ingresa a tu portal de cliente para hacer seguimiento de tu vehículo en tiempo real.
          </p>

          <form onSubmit={handleLogin} className="space-y-5 bg-card/40 p-6 rounded-2xl border border-border shadow-xl backdrop-blur-sm">
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Email de Usuario
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@lionfix.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-border focus:ring-primary focus:border-primary transition-all rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Contraseña
                </Label>
                <Link href="#" className="text-xs text-primary hover:underline font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-border focus:ring-primary focus:border-primary transition-all rounded-xl"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-sm font-bold tracking-wide rounded-xl mt-2 flex items-center justify-center gap-2 group" 
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </Button>

            <div className="pt-2">
               <Button onClick={(e) => { e.preventDefault(); login('admin@lionfix.com', '123456'); }} variant="outline" className="w-full h-12 text-xs font-semibold rounded-xl border-border/50 hover:bg-white/5">
                  Acceder como Administrador (Demo)
              </Button>
            </div>
            
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground bg-card/20 border border-border/50 rounded-xl p-4">
            <p>¿Tienes problemas para ingresar?</p>
            <p>Contacta a <span className="text-primary font-medium">soporte@lionfix.com</span> o habla con tu administrador.</p>
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: FEATURE SHOWCASE (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-[#0a0a0c] relative flex-col justify-center p-16 overflow-hidden border-l border-border/30">
        
        {/* Subtle background glow/gradient to make it premium */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Dotted pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/40 pointer-events-none"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

        <div className="relative z-10 max-w-lg mx-auto">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-xs font-semibold text-primary">Portal de Clientes</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] mb-12">
            Seguimiento y transparencia total para tu vehículo.
          </h2>

          <div className="space-y-8">
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                <ShieldCheck className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Historial Detallado</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Accede al registro completo de mantenimientos, reparaciones y el estado general de tu vehículo en todo momento de manera segura.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Seguimiento en Vivo</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Conoce exactamente en qué etapa de reparación se encuentra tu vehículo, sin necesidad de hacer múltiples llamadas al taller.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Transparencia Garantizada</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Visualiza evidencia fotográfica desde el ingreso de tu vehículo, aprueba presupuestos fácilmente y recibe notificaciones claras de cada diagnóstico.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
