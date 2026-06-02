import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BMS Passenger Chatbot",
};

export default function PassengerChatbotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}