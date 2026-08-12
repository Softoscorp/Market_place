import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { GlobalNotification } from "@/components/chat/GlobalNotification";
import { AuthProvider } from "@/components/AuthProvider";
import { OrganizationSchema } from '@/components/seo/SchemaMarkup';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "House Agent - North Cyprus Housing",
  description: "North Cyprus housing rental platform",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "House Agent",
  },
};

export const viewport = {
  themeColor: "#08192F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body>
        <OrganizationSchema />
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            disableTransitionOnChange
          >
            <AuthProvider>
              <Navbar />
              <main>{children}</main>
              <Footer />
              <ChatPanel />
              <GlobalNotification />
            </AuthProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
