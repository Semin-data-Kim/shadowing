import type { Metadata } from "next"
import "./globals.css"
import Header from "@/components/layout/Header"
import AuthProvider from "@/components/AuthProvider"

export const metadata: Metadata = {
  title: "ShadowTube - YouTube 섀도잉",
  description: "YouTube 영상으로 영어 섀도잉 연습을 시작하세요",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <AuthProvider>
          <Header />
          <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
