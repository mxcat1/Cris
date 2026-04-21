import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Criscom Group | Tecnología que impulsa tu futuro",
  description:
    "Criscom Group — tienda oficial de tecnología: laptops, componentes, periféricos y soluciones empresariales en Perú.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://criscomgroup.com.pe",
  ),
  openGraph: {
    title: "Criscom Group | Tecnología que impulsa tu futuro",
    description:
      "Tecnología de vanguardia, asesoría especializada y soporte técnico profesional.",
    url: "https://criscomgroup.com.pe",
    siteName: "Criscom Group",
    locale: "es_PE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

