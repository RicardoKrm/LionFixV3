
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Redirigiendo a tu panel...",
      });
      // La redirección se maneja en el AuthProvider
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de Autenticación",
        description: (error as Error).message,
      });
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl bg-card border-border">
        <CardHeader className="text-center pb-8 pt-10">
          <div className="flex justify-center items-center mb-2">
            <Image
              src="/logo2.png"
              alt="LionFix Service Logo"
              width={180}
              height={90}
              className="h-28 w-auto object-contain drop-shadow-[0_0_16px_rgba(202,162,0,0.35)]"
              priority
            />
          </div>
          <CardDescription className="text-lg text-muted-foreground mt-1">
            Inicia sesión para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm">
           <p className="text-muted-foreground">
            ¿Aún no tienes una cuenta?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Regístrate aquí
            </Link>
          </p>
          <Separator className="my-2"/>
           <div className="flex justify-center mt-4">
                 <Button onClick={() => login('admin@lionfix.com', '123456')} variant="secondary" className="w-full">
                    Acceder como Administrador (Demo)
                </Button>
           </div>
        </CardFooter>
      </Card>
    </main>
  );
}
