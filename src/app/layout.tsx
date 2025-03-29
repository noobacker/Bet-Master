import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BetWise Pro - Smart Betting Calculator",
  description: "Calculate your IPL betting amounts with precision and ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-100 dark:bg-gray-900 transition-colors duration-200`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
