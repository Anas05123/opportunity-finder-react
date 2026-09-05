import * as Figma from 'figma-api';

/**
 * Careerly Figma Client Utility
 * Allows querying Figma files, design tokens, and components directly from Figma REST API.
 */
export function createFigmaClient(personalAccessToken = (typeof process !== 'undefined' ? (process.env.FIGMA_PERSONAL_ACCESS_TOKEN || process.env.VITE_FIGMA_TOKEN) : null)) {
  if (!personalAccessToken) {
    console.warn('[Figma Client] Personal Access Token not configured.');
    return null;
  }
  return new Figma.Client({ personalAccessToken });
}

export async function getFigmaFile(fileKey, token) {
  const client = createFigmaClient(token);
  if (!client) throw new Error('Figma client requires personal access token.');
  return await client.file(fileKey);
}

export async function getFigmaImage(fileKey, nodeIds = [], token, format = 'png', scale = 2) {
  const client = createFigmaClient(token);
  if (!client) throw new Error('Figma client requires personal access token.');
  return await client.fileImages(fileKey, { ids: nodeIds, format, scale });
}

export default {
  createFigmaClient,
  getFigmaFile,
  getFigmaImage
};
