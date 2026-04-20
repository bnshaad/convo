import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ZustandProvider } from "@/components/layout/ZustandProvider";
import { TransitionWrapper } from "@/components/layout/TransitionWrapper";
import { SessionSync } from "@/components/auth/SessionSync";
import { PresenceProvider } from "@/components/providers/PresenceProvider";
import { ChatInitializer } from "@/components/chat/ChatInitializer";

const font = Space_Grotesk({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Neobrutalism Chat",
  description: "A production-grade Neobrutalist chat application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#FFF8F0] overflow-x-hidden">
      <body className={`${font.className} antialiased selection:bg-nb-yellow selection:text-nb-black min-h-screen`}>
        <ZustandProvider>
          <SessionSync />
          <PresenceProvider>
            <ChatInitializer />
            <TransitionWrapper>
              {children}
            </TransitionWrapper>
          </PresenceProvider>
        </ZustandProvider>
      </body>
    </html>
  );
}
