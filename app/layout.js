import '@fontsource-variable/jost';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import './globals.css';

const title = 'Who Wins the Nobel';
const description =
  'Every Nobel Prize since 1901 in six charts: who wins, how old they are, where they come from, and how that has changed.';

export const metadata = {
  metadataBase: new URL('https://briandaviddavidson.com'),
  title,
  description,
  authors: [{ name: 'Brian Davidson', url: 'https://briandaviddavidson.com' }],
  openGraph: {
    title,
    description,
    url: '/nobel/',
    siteName: 'Brian Davidson',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title, description },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f4' },
    { media: '(prefers-color-scheme: dark)', color: '#121110' },
  ],
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
