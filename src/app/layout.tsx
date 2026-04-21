import type { Metadata } from "next";
import "./globals.css";
import { ZustandProvider } from "@/components/layout/ZustandProvider";
import { TransitionWrapper } from "@/components/layout/TransitionWrapper";
import { SessionSync } from "@/components/auth/SessionSync";
import { PresenceProvider } from "@/components/providers/PresenceProvider";
import { ChatInitializer } from "@/components/chat/ChatInitializer";

export const metadata: Metadata = {
  title: "CONVO",
  description: "A fun innovation in real-time communication.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#FFF8F0] overflow-x-hidden">
      <body className="antialiased selection:bg-nb-yellow selection:text-nb-black min-h-screen font-sans">
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
