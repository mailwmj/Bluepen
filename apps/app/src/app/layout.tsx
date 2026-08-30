import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@bluepen/editor/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Bluepen — Wireframe at the speed of thought",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", inter.variable, geistMono.variable)}
    >
      <body className="relative min-h-full">
        <script
          dangerouslySetInnerHTML={{
            __html: `if ("__TAURI_INTERNALS__" in window) { var s=document.documentElement.style; s.background="transparent"; document.body.style.background="transparent"; }`,
          }}
        />
        <div className="isolate relative flex min-h-svh flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
