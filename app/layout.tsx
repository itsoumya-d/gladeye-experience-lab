import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gladeye Experience Lab",
  description: "Experiment uplift, sample-ratio checks and Core Web Vitals release gating.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
