import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MEDUSA",
    template: "%s | MEDUSA",
  },
  description:
    "MEDUSA turns facial geometry, skin analysis, and AI guidance into personalized makeup direction, live MVP included.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-obsidian text-[color:var(--color-ink)] font-sans selection:bg-[color:var(--color-accent-soft)] selection:text-[color:var(--color-ink)]">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8efe8_0%,#f7ede6_34%,#f2e4dc_68%,#efe2da_100%)]" />
          <div className="absolute left-[-8rem] top-[-5rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(180,43,37,0.12),_transparent_62%)] blur-3xl" />
          <div className="absolute right-[-8rem] top-[12%] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,_rgba(201,131,91,0.16),_transparent_62%)] blur-3xl" />
          <div className="absolute bottom-[-10rem] left-[18%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,_rgba(126,37,45,0.1),_transparent_65%)] blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(84,35,27,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(84,35,27,0.035)_1px,transparent_1px)] bg-[size:6rem_6rem]" />
        </div>
        <Navbar />
        <main className="flex-1 flex flex-col pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
