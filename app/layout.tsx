import type { Metadata } from "next";
import { Inter, Shadows_Into_Light } from "next/font/google";
import "./globals.css";
import Header from './components/Header';
import Footer from './components/Footer';

const inter = Inter({ subsets: ["latin"] });
const shadowsIntoLight = Shadows_Into_Light({ 
  weight: '400',
  subsets: ["latin"],
  variable: '--font-shadows-into-light',
});

export const metadata: Metadata = {
  title: "leftovers.wiki",
  description: "Your guide to making the most of your leftovers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${shadowsIntoLight.variable}`}>
        <main className="min-h-screen">
          <Header />
          {children}
          <Footer />
        </main>
      </body>
    </html>
  );
}
