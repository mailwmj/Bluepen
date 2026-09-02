import type { Metadata } from "next";
import Script from "next/script";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@bluepen/editor/lib/utils";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei UI",
    "Microsoft YaHei",
    "Source Han Sans SC",
    "Noto Sans SC",
    "sans-serif",
  ],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
  display: "swap",
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Cascadia Code",
    "Cascadia Mono",
    "Segoe UI Mono",
    "Menlo",
    "Monaco",
    "Consolas",
    "PingFang SC",
    "Microsoft YaHei UI",
    "Microsoft YaHei",
    "Noto Sans SC",
    "monospace",
  ],
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
      suppressHydrationWarning
      className={cn("h-full antialiased dark overscroll-none", spaceGrotesk.variable, spaceMono.variable)}
    >
      <body className="relative h-full overflow-hidden bg-background text-foreground font-sans overscroll-none">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("bluepen:settings");var m="dark";if(t){var s=JSON.parse(t);if(s.theme)m=s.theme;}if(m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark");}else if(m==="light"){document.documentElement.classList.remove("dark");}}catch(e){}})();`,
          }}
        />
        <div className="isolate relative flex h-full w-full min-h-0 flex-col overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
