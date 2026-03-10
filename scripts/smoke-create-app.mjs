import { _electron as electron } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const DEV_PORT = process.env.SMOKE_DEV_PORT || '5179';
const devUrl = `http://localhost:${DEV_PORT}`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const outPath = path.join(process.cwd(), 'scripts', 'smoke-create-app.out.json');
  const electronApp = await electron.launch({
    args: [process.cwd()],
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: devUrl,
    },
  });

  try {
    const page = await electronApp.firstWindow();

    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
    await page.waitForFunction(() => !!window.electronAPI?.feishuCreateApp, null, { timeout: 30000 });

    const result = await page.evaluate(() => window.electronAPI.feishuCreateApp());
    await sleep(500);

    const errorText = typeof result?.error === 'string' ? result.error : '';
    const cloneError = errorText.toLowerCase().includes('could not be cloned');

    const out = {
      ok: !cloneError,
      devUrl,
      action: 'feishuCreateApp',
      result,
    };

    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8');

    if (cloneError) {
      process.exitCode = 1;
    }
  } finally {
    await electronApp.close();
  }
}

main().catch((e) => {
  process.stderr.write(String(e) + '\n');
  process.exitCode = 1;
});

