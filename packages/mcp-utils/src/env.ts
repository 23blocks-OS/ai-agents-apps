/**
 * Environment variable utilities
 */

const REQUIRED_VARS = [
  'BLOCKS_API_URL',
  'BLOCKS_API_KEY',
  'BLOCKS_AUTH_TOKEN'
] as const;

export interface EnvVars {
  BLOCKS_API_URL: string;
  BLOCKS_API_KEY: string;
  BLOCKS_AUTH_TOKEN: string;
}

/**
 * Validate that all required environment variables are set
 * Throws an error if any are missing
 */
export function validateEnvVars(): EnvVars {
  const missing: string[] = [];

  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please set these variables before running the MCP app.'
    );
  }

  return {
    BLOCKS_API_URL: process.env.BLOCKS_API_URL!,
    BLOCKS_API_KEY: process.env.BLOCKS_API_KEY!,
    BLOCKS_AUTH_TOKEN: process.env.BLOCKS_AUTH_TOKEN!
  };
}

/**
 * Get environment variables with defaults
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value || defaultValue!;
}
