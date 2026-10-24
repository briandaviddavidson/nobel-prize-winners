import './globals.css';

export const metadata = {
  title: 'Who Wins the Nobel',
  description: 'Charts on who wins the Nobel Prize and how that has changed since 1901.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    // Browser extensions (e.g. Ember Inspector, Grammarly) add attributes to <html> and
    // <body> before hydration; this ignores those two elements' attributes only.
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
