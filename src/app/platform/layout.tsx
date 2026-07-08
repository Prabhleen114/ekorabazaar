import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform | Ekora Bazaar",
  description:
    "Interactive platform page for Ekora Bazaar with trust signals, sample kit focus, and wholesale-ready flows.",
};

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
