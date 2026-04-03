import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ServiceSchema } from './base.schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// example-service.js contains placeholder URLs that fail Zod validation — skip it.
const SKIP = new Set(['base.schema.js', 'registry.js', 'example-service.js']);

/**
 * Dynamically imports all service config files in this directory,
 * validates each with Zod, and returns the array.
 *
 * Throws at startup if any config is invalid — fail fast, don't silently skip.
 *
 * @returns {Promise<import('./base.schema.js').Service[]>}
 */
export async function loadAll() {
  const files = readdirSync(__dirname)
    .filter(f => f.endsWith('.js') && !SKIP.has(f))
    .sort();

  if (files.length === 0) {
    console.warn('[registry] No service configs found in services/. Add one based on example-service.js.');
    return [];
  }

  const services = await Promise.all(
    files.map(async file => {
      const mod = await import(join(__dirname, file));
      const raw = mod.default;
      const result = ServiceSchema.safeParse(raw);
      if (!result.success) {
        throw new Error(
          `[registry] Invalid service config in ${file}:\n${result.error.message}`,
        );
      }
      return result.data;
    }),
  );

  console.log(`[registry] Loaded ${services.length} service(s): ${services.map(s => s.id).join(', ')}`);
  return services;
}
