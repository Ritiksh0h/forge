import type { Metadata, Viewport } from "next";
import { Anybody, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const anybody = Anybody({ subsets: ["latin"], weight: ["600", "800", "900"], variable: "--font-anybody" });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-ibm-plex-mono" });

export const metadata: Metadata = {
  title: "FORGE — Data-Driven Gym Coaching",
  description: "FORGE tells intermediate lifters exactly what to change each week.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "FORGE" },
};

export const viewport: Viewport = {
  themeColor: "#08080A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-[#08080A]">
      <body className={`${anybody.variable} ${ibmPlexMono.variable} font-[family-name:var(--font-ibm-plex-mono)] antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
