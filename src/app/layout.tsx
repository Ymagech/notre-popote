import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { FilterProvider } from "@/context/FilterContext";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notre Popote",
  description: "Application familiale de gestion de recettes, courses et garde-manger.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <AuthGuard>
            <FilterProvider>
              <div className="app-container">
                <Sidebar />
                <main className="main-content">
                  {children}
                </main>
              </div>
            </FilterProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
