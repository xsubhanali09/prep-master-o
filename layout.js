import "./globals.css";

export const metadata = {
  title: "Prep Master",
  description: "Study, batches, community and AI doubts"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}