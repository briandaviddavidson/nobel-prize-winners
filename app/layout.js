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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
