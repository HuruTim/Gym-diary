import "./globals.css";

export const metadata = {
  title: "Mistral Chat",
  description: "Minimal chat app powered by the Mistral API",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
