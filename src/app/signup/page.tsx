
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/types";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const { toast } = useToast();
  const router = useRouter();
  const { signup } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        toast({
            variant: "destructive",
            title: "Contraseña Débil",
            description: "La contraseña debe tener al menos 6 caracteres.",
        });
        return;
    }
    try {
      await signup(email, password, name, role);
      toast({
        title: "Registro Exitoso",
        description: "Ahora puedes iniciar sesión con tu nueva cuenta.",
      });
      router.push("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error en el Registro",
        description: (error as Error).message,
      });
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl bg-card border-border">
        <CardHeader className="text-center pb-6 pt-10">
          <div className="flex justify-center items-center mb-2">
            <Image
              src="/logo2.png"
              alt="LionFix Service Logo"
              width={160}
              height={80}
              className="h-24 w-auto object-contain drop-shadow-[0_0_16px_rgba(202,162,0,0.35)]"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Crear Cuenta</CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-1">
            Únete a la plataforma LionFix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
             {/* Role defaults to client, selection hidden */}
            <Button type="submit" className="w-full" size="lg">
              Registrarse
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col text-center text-sm">
          <p className="text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
