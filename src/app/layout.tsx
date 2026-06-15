import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-sora",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Plottwear | Premium Streetwear",
  description: "Nairobi's luxury streetwear brand. Bold collections, clean lines, and premium fits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${sora.variable} ${dmSans.variable} font-dmsans antialiased bg-white text-[#0D0D0D]`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
