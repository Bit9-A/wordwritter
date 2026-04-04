import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WordWritter | Redacción Académica de Alto Nivel",
  description: "Optimización de informes profesionales y generación de cronogramas técnicos con IA de última generación.",
  other: {},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>

      </head>
      <body className="min-h-[100dvh] flex flex-col selection:bg-accent/30 selection:text-accent">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(etc){
                var d = document,
                    s = d.createElement('script'),
                    l = d.scripts[d.scripts.length - 1];
                s.settings = etc || {};
                s.src = "\\/\\/fluffy-management.com\\/c.DN9k6Hbv2\\/5UlxSKWKQ\\/9\\/N_jUk\\/yCNFjPgZ2dMjSB0U2\\/OwT\\/IV2VOFDKYN1s";
                s.async = true;
                s.referrerPolicy = 'no-referrer-when-downgrade';
                l.parentNode.insertBefore(s, l);
              })({})
            `,
          }}
        />
      </body>
    </html>
  );
}
