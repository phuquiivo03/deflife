import type { Metadata } from "next";
import { Inter, Pixelify_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const pixel = Pixelify_Sans({ subsets: ["latin"], variable: "--font-pixel" });

export const metadata: Metadata = {
  title: "devlife",
  description: "A cozy developer life-sim room builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${pixel.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
