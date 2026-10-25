import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const DATA_DIR = join(ROOT, 'data');
export const RAW_DIR = join(DATA_DIR, 'raw');
export const PROCESSED_DIR = join(DATA_DIR, 'processed');
export const GEOCODE_CACHE = join(DATA_DIR, 'geocode-cache.json');
export const GEOCODE_OVERRIDES = join(DATA_DIR, 'geocode-overrides.json');
export const QUALITY_REPORT = join(DATA_DIR, 'quality-report.json');
export const PORTRAITS = join(DATA_DIR, 'portraits.json');

export const rawPath = (name) => join(RAW_DIR, `${name}.json`);
export const processedPath = (name) => join(PROCESSED_DIR, name);
