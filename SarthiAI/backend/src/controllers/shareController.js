import { writeFile, mkdir, unlink, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = join(__dirname, '..', '..', 'temp');

async function cleanup() {
  try {
    const files = await readdir(TEMP_DIR);
    const now = Date.now();
    for (const f of files) {
      const parts = f.split('-');
      const ts = parseInt(parts[0], 10);
      if (now - ts > 600_000) await unlink(join(TEMP_DIR, f)).catch(() => {});
    }
  } catch {}
}

export async function sharePdfHandler(req, res) {
  try {
    const { pdf } = req.body;
    if (!pdf) return res.status(400).json({ error: 'Missing pdf (base64)' });

    await mkdir(TEMP_DIR, { recursive: true });
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.pdf`;
    const filepath = join(TEMP_DIR, filename);
    await writeFile(filepath, Buffer.from(pdf, 'base64'));

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    cleanup();

    res.json({ url: `${baseUrl}/temp/${filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
