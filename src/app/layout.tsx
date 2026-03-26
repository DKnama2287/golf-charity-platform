import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BirdieFund | Golf Charity Subscription Platform",
  description:
    "A modern golf charity subscription platform with score tracking, prize draws, and impact-led giving.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
