import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import Navbar from "./components/Navbar";
import { ToastProvider } from "./components/Toast";
import { NotificationProvider } from "./contexts/NotificationContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "TeamUp - Find Your Perfect Hackathon Team",
  description: "Connect with talented developers, designers, and innovators. Build your dream hackathon team in minutes, not days.",
  keywords: "hackathon, team, developers, designers, collaboration, innovation",
  authors: [{ name: "TeamUp Team" }],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "TeamUp - Find Your Perfect Hackathon Team",
    description: "Connect with talented developers, designers, and innovators. Build your dream hackathon team in minutes, not days.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased bg-gradient min-h-screen font-sans flex flex-col">
        {/* Background decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-200/20 to-red-200/20 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-2xl animate-blob animation-delay-4000"></div>
        </div>

        <NotificationProvider>
          <ToastProvider>
            <Providers>
              <Navbar />
              <main className="pt-20 relative flex-1">
                {children}
              </main>
              <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center text-gray-600">
                    <p className="text-sm">
                      © {new Date().getFullYear()} TeamUp. All rights reserved. | Copyright by Kittiphon
                    </p>
                  </div>
                </div>
              </footer>
            </Providers>
          </ToastProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
