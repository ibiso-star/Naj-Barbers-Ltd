import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toaster";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: { default: "Keel", template: "%s · Keel" },
  description: "Projects and tasks for small teams, organised by workspace.",
  // The app is behind sign-in; nothing here should be indexed (release-checklist SEO).
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#09090b", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${plexSans.variable} ${plexMono.variable} h-full`}>
      <body className="h-full font-sans text-[14px] antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
