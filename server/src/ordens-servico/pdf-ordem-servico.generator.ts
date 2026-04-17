import { Injectable, OnModuleDestroy } from '@nestjs/common';
import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';
import { HtmlOrdemServicoGenerator } from './html-ordem-servico.generator';

const PDF_TIMEOUT_MS = 30_000;

@Injectable()
export class PdfOrdemServicoGenerator implements OnModuleDestroy {
  private browserPromise: Promise<Browser> | null = null;

  constructor(
    private readonly htmlOrdemServicoGenerator: HtmlOrdemServicoGenerator,
  ) {}

  async onModuleDestroy() {
    if (this.browserPromise) {
      const browser = await this.browserPromise.catch(() => null);
      if (browser) await browser.close();
      this.browserPromise = null;
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browserPromise;
  }

  async gerar(
    os: { numero: number } & Record<string, unknown>,
  ): Promise<Buffer> {
    const html = this.htmlOrdemServicoGenerator.gerar(os);
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: PDF_TIMEOUT_MS,
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }
}
