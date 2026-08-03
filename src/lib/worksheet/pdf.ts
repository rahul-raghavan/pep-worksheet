import { existsSync } from 'fs';
import chromium from '@sparticuz/chromium';
import {
  chromium as playwrightChromium,
  type Browser,
  type BrowserContext,
} from 'playwright-core';

export interface PdfDocument {
  name: string;
  html: string;
}

const LOCAL_CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

async function resolveBrowser(): Promise<{ executablePath: string; args: string[] }> {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return { executablePath: process.env.CHROME_PATH, args: [] };
  }
  const localPath = LOCAL_CHROME_PATHS.find((candidate) => existsSync(candidate));
  if (localPath) return { executablePath: localPath, args: [] };
  chromium.setGraphicsMode = false;
  return {
    executablePath: await chromium.executablePath(),
    args: chromium.args,
  };
}

export async function renderPdfDocuments(documents: PdfDocument[]): Promise<Map<string, Buffer>> {
  const browserConfig = await resolveBrowser();
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    browser = await playwrightChromium.launch({
      executablePath: browserConfig.executablePath,
      args: browserConfig.args,
      headless: true,
    });
    context = await browser.newContext();
    const page = await context.newPage();
    const results = new Map<string, Buffer>();

    for (const pdfDocument of documents) {
      await page.setContent(pdfDocument.html, { waitUntil: 'load' });
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      results.set(pdfDocument.name, Buffer.from(pdf));
    }
    return results;
  } finally {
    if (context) await context.close().catch(() => undefined);
    if (browser) await browser.close().catch(() => undefined);
  }
}
