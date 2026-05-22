import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/auth-context";

// SEO Metadata Optimized for Local Search (Iquique)
export const metadata: Metadata = {
  title: "LionFix | Taller Mecánico Especialista en Mercedes Sprinter en Iquique",
  description: "El mejor taller mecánico en Iquique, Chile, especializado en furgones Mercedes-Benz Sprinter y vehículos comerciales. Diagnóstico avanzado, repuestos premium y mantenimiento de flotas con estándar alemán.",
  keywords: "taller mecanico iquique, especialista sprinter iquique, reparacion mercedes benz iquique, mecanico sprinter, taller vehiculos comerciales iquique, mantencion sprinter iquique, lionfix iquique, repuestos mercedes iquique",
  authors: [{ name: "LionFix Service" }],
  openGraph: {
    siteName: "LionFix Service",
    images: [
      {
        url: "/og-image.jpg", // Create and add this image to /public
        width: 1200,
        height: 630,
        alt: "Taller Mecánico LionFix en Iquique",
      },
    ],
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LionFix Service | Expertos en Vehículos de Trabajo en Iquique",
    description: "Taller mecánico líder en Iquique para camiones, buses y Sprinter. Tecnología de punta, técnicos certificados y garantía total.",
    images: ["/og-image.jpg"], // Create and add this image to /public
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo.jpeg', type: 'image/jpeg' },
    ],
    apple: '/logo.jpeg',
    shortcut: '/logo.jpeg',
  },
  manifest: '/site.webmanifest',
};

// JSON-LD Structured Data for Local SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoRepair",
  "name": "LionFix Service",
  "image": "https://lionfix-erp-demo.web.app/logo.png", // Replace with actual domain
  "@id": "https://lionfix-erp-demo.web.app", // Replace with actual domain
  "url": "https://lionfix-erp-demo.web.app", // Replace with actual domain
  "telephone": "+56572123456",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Zona Franca, Manzana 5",
    "addressLocality": "Iquique",
    "addressRegion": "Tarapacá",
    "postalCode": "1100000",
    "addressCountry": "CL"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -20.24, // Placeholder coordinates for Iquique
    "longitude": -70.15
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "opens": "08:30",
    "closes": "18:30"
  },
  "sameAs": [
    // Add social media links here e.g. "https://www.facebook.com/lionfix"
  ]
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Jost:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap"
          rel="stylesheet"
        />
         <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
