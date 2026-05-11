// Minimal Pages-router _document shim.
// Roshetta uses the App Router exclusively. This file exists ONLY to give
// Next.js a valid <Html> host during the synthetic /404 prerender step —
// without it, certain Docker builds error out with
//   "<Html> should not be imported outside of pages/_document".
// See https://github.com/vercel/next.js/issues for the related bug reports.
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
