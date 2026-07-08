import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why Ekora — Ekora Bazaar",
  description: "Our mission to build the commerce infrastructure that independent creators deserve.",
};

export default function WhyEkoraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
