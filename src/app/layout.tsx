import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const galmuri7 = localFont({
  src: "./fonts/Galmuri7.woff2",
  variable: "--font-galmuri-7",
  display: "swap",
});

const galmuri9 = localFont({
  src: "./fonts/Galmuri9.woff2",
  variable: "--font-galmuri-9",
  display: "swap",
});

const galmuri11 = localFont({
  src: "./fonts/Galmuri11.woff2",
  variable: "--font-galmuri-11",
  display: "swap",
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
    <html
      lang="vi"
      className={`${galmuri7.variable} ${galmuri9.variable} ${galmuri11.variable}`}
    >
      <body className="devlife-page-bg font-galmuri-9 text-galmuri-body antialiased">
        {children}
      </body>
    </html>
  );
}
