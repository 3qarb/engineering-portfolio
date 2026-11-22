// Dev-server only: "Publish to the site files" on the Add-project page writes the project into
// public/data/projects.json, the copy every visitor loads. Commit and deploy to make it public.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Plugin } from 'vite';

const MAX_BYTES = 8 * 1024 * 1024;
const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;

export function publishProjects(root: string): Plugin {
  const file = resolve(root, 'public/data/projects.json');
  return {
    name: 'portfolio-publish',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__portfolio/publish', (req, res) => {
        const fail = (code: number, msg: string) => {
          res.statusCode = code;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: msg }));
        };
        // same-origin only: a custom header forces a CORS preflight that this server never allows
        if (req.method !== 'POST' || req.headers['x-portfolio-publish'] !== '1') return fail(405, 'not allowed');
        const origin = req.headers.origin;
        if (origin && new URL(origin).host !== req.headers.host) return fail(403, 'wrong origin');
        let size = 0;
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => {
          size += c.length;
          if (size > MAX_BYTES) req.destroy();
          else chunks.push(c);
        });
        req.on('end', () => {
          try {
            const project = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (!project || typeof project !== 'object' || !SLUG.test(project.slug) || typeof project.title !== 'string') return fail(400, 'not a project');
            const list: { slug: string }[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
            const next = [project, ...list.filter((p) => p.slug !== project.slug)];
            mkdirSync(dirname(file), { recursive: true });
            writeFileSync(file, JSON.stringify(next, null, 1));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, count: next.length, file: 'public/data/projects.json' }));
          } catch {
            fail(400, 'bad JSON');
          }
        });
      });
    },
  };
}
