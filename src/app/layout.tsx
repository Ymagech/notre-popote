import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notre Popote",
  description: "Application de gestion familiale pour recettes, courses et garde-manger.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}
