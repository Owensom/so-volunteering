import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SO Volunteering",
    template: "%s | SO Volunteering",
  },
  description:
    "Belong • Grow • Thrive. An inclusive volunteering and employability platform helping people find opportunities, build confidence and build a positive pathway.",
  applicationName: "SO Volunteering",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/brand/so-volunteering-logo-mark.png",
    shortcut: "/brand/so-volunteering-logo-mark.png",
    apple: "/brand/so-volunteering-logo-mark.png",
  },
  appleWebApp: {
    capable: true,
    title: "SO Volunteering",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#f3fff8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
