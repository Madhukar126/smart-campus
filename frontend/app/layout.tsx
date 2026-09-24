import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus360 — Report. Track. Resolve.",
  description: "Smart campus issue reporting and resolution system",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

