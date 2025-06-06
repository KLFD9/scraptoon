import puppeteer, { Browser, LaunchOptions } from 'puppeteer';

/**
 * Launches a Puppeteer browser with common arguments.
 *
 * The `--no-sandbox` flag is required because the server runs as root in
 * certain container environments where Chromium's sandbox cannot start.
 * If your deployment supports the sandbox, you can remove this flag.
 */
export function launchBrowser(options: LaunchOptions = {}): Promise<Browser> {
  const commonArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-web-security',
  ];
  return puppeteer.launch({
    headless: true,
    ...options,
    args: options.args ? [...commonArgs, ...options.args] : commonArgs,
  });
}
