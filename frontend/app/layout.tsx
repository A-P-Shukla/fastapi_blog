import type { Metadata, Viewport } from "next";
import { Montserrat, Nunito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

const montserrat = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FastAPI Blog",
  description: "A blog built with FastAPI and Next.js",
  authors: [{ name: "AP Shukla" }],
};

export const viewport: Viewport = {
  themeColor: "#527c9f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${nunito.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#1a1a1a]">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pt-20 pb-8">
            <div className="max-w-5xl mx-auto px-4">
              <div className="flex flex-col md:flex-row gap-6">
                {children}
              </div>
            </div>
          </main>
          <footer className="border-t border-gray-200 dark:border-[#333] py-4 bg-gray-50 dark:bg-[#111]">
            <div className="text-center text-sm text-gray-400">
              © {new Date().getFullYear()} AP Shukla
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
