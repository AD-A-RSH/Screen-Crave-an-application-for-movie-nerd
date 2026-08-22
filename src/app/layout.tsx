import type { Metadata } from "next";
import type { ReactNode } from "react";
import NavBar from "../components/NavBar";
import "../css/index.css";
import "../css/App.css";
import "../css/NavBar.css";
import "../css/Home.css";
import "../css/MovieCard.css";
import "../css/Auth.css";
import "../css/Lists.css";
import "../css/MovieDetail.css";
import { Suspense } from "react";
import NavBarSkeleton from "../components/NavBarSkeleton";

export const metadata: Metadata = {
  title: "ScreenCrave",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<NavBarSkeleton />}>
          <NavBar />
        </Suspense>
        <main>{children}</main>
      </body>
    </html>
  );
}