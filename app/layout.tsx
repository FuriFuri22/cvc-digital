
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CVC Digital | Internet y Televisión HD",
    template: "%s | CVC Digital",
  },
  description:
    "Conocé los servicios de internet y televisión HD de CVC Digital en Formosa y Clorinda. Consultá cobertura y solicitá tu servicio.",
  applicationName: "CVC Digital",
  icons: {
  icon: "/cvc-icon.png",
},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
