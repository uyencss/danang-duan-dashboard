import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    template: "%s | MobiFone DNA  GPS",
    default: "MobiFone DNA  GPS",
  },
  description: "Hệ thống Quản trị Báo cáo Dự án Tập trung - MobiFone Đà Nẵng",
};

import { ModalProvider } from "@/components/ui/use-modal";
import { AlertProvider } from "@/components/ui/use-alert";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full" suppressHydrationWarning>
        <AlertProvider>
          <ModalProvider>
            {children}
            <Toaster position="top-right" richColors />
          </ModalProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
