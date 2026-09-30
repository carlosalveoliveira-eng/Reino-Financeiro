import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reino Financeiro",
  manifest: "/manifest.webmanifest",
  description: "Seu dinheiro, suas metas e seu reino. Gestão financeira pessoal com progresso real.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
