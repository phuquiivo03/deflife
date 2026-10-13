import type { Metadata } from "next";
import { Plus_Jakarta_Sans, VT323 } from "next/font/google";
import "./globals.css";

const vt323 = VT323({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-readable",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "devlife",
  description: "Mô phỏng cuộc sống lập trình viên — xây phòng pixel-art ấm cúng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${vt323.variable} ${plusJakarta.variable} font-sans text-lg antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
