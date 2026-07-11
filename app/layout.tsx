import type { Metadata, Viewport } from "next";
import "@silk-hq/components/layered-styles";
import "./globals.css";

export const metadata: Metadata = {
  title: "GameOn",
  description: "Find and join local sports games nearby.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GameOn",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0f" },
  ],
};

// Apply the saved (or system) theme before paint to avoid a light-mode flash.
const themeInitScript = `try{var t=localStorage.getItem("gameon-theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
