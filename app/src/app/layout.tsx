import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Findr — Next-Gen Real-Time Lost & Found Network",
  description:
    "Empathetic, community-driven lost and found network connecting people with their cherished belongings through verified custody and cryptographic matching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="bg-background font-body-md text-on-surface min-h-screen relative selection:bg-primary-fixed selection:text-on-primary-fixed">
        {/* Subtle mesh atmospheric ambient gradients */}
        <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-surface-container-low/60 via-transparent to-surface-container/30" />
        {children}
      </body>
    </html>
  );
}
