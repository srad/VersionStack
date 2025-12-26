import { readFileSync } from 'fs';
import { join } from 'path';

let cachedVersion: string | undefined;

/**
 * Gets the application version from package.json
 * @returns The version string (e.g., "2.0.0")
 */
export function getAppVersion(): string {
  if (cachedVersion !== undefined) {
    return cachedVersion;
  }

  try {
    // In production (dist/), package.json is one level up from dist
    // In development (src/), package.json is two levels up from src
    const packagePath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const version = (packageJson.version as string | undefined) || '0.0.0';
    cachedVersion = version;
    return version;
  } catch (error) {
    console.error('Failed to read version from package.json:', error);
    const fallbackVersion = '0.0.0';
    cachedVersion = fallbackVersion;
    return fallbackVersion;
  }
}
