import axios, { AxiosResponse } from 'axios';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';

const STABILITY_AI_BASE_URL = 'https://api.stability.ai';

export enum APIVersion {
  V1 = 'v1',
  V2_BETA = 'v2beta',
}

// TYPE DEFINTIONS

export type OutputFormat = 'jpeg' | 'png' | 'webp';
export const DEFAULT_OUTPUT_FORMAT: OutputFormat = 'png';

export type StabilityAIContentResponse = {
  filepath: string;
  filename: string;
  contentType: 'image' | 'video';
  outputFormat: OutputFormat | 'mp4';
  contentFiltered: boolean;
  errored: boolean;
  seed: number;
};

export type StabilityAIStatusResult = {
  id: string,
  status: 'in-progress'
}

// HELPER FUNCTIONS

export function makeUrl(
  verison: APIVersion,
  resource: string,
  endpoint: string,
) {
  return `${STABILITY_AI_BASE_URL}/${verison}/${resource}${endpoint.length > 0 ? `/${endpoint}` : ''}`;
}

/**
 * Download an image from a URL and return the local file path
 *
 * @param url
 * @returns filepath string
 */
export async function downloadImage(url: string) {
  const filename = `image-${uuidv4()}.png`;
  const filepath = path.join(os.tmpdir(), filename);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  await fs.ensureDir(path.dirname(filepath));
  await new Promise(async (resolve, reject) => {
    try {
      response.data
        .pipe(fs.createWriteStream(filepath))
        .on('error', reject)
        .once('close', () => resolve(filepath));
    } catch (err) {
      reject(err);
    }
  });
  return filepath;
}

export async function processContentResponse(
  data: any,
  outputFormat: OutputFormat | 'mp4',
  resource: string,
): Promise<StabilityAIContentResponse> {
  let fileData = outputFormat === 'mp4' ? data.video : data.image;
  if (!fileData) fileData = data.base64;
  if (!fileData) throw new Error('No file data found in response');
  const finishReason: 'SUCCESS' | 'CONTENT_FILTERED' | 'ERROR' = data.finish_reason;

  const filename = `${resource}_${uuidv4()}.${outputFormat}`;
  const filepath = path.join(os.tmpdir(), filename);

  await fs.writeFile(filepath, fileData, 'base64');

  return {
    filepath,
    filename,
    contentType: outputFormat === 'mp4' ? 'video' : 'image',
    outputFormat,
    contentFiltered: finishReason === 'CONTENT_FILTERED',
    errored: finishReason === 'ERROR',
    seed: data.seed,
  };
}

// ERROR HANDLING

export type StabilityAIErrorName =
  | 'StabilityAIInvalidRequestError'
  | 'StabilityAIUnauthorizedError'
  | 'StabilityAIContentModerationError'
  | 'StabilityAIRecordNotFoundError'
  | 'StabilityAIUnknownError';

export class StabilityAIError extends Error {
  constructor(status: number, message: string, data?: any) {
    let dataMessage: string;

    try {
      dataMessage = JSON.stringify(data);
    } catch {
      dataMessage = '';
    }

    const fullMessage = `${message}: ${dataMessage}`;

    super(fullMessage);

    let name: StabilityAIErrorName = 'StabilityAIUnknownError';

    switch (status) {
      case 400:
        name = 'StabilityAIInvalidRequestError';
        break;
      case 401:
        name = 'StabilityAIUnauthorizedError';
        break;
      case 403:
        name = 'StabilityAIContentModerationError';
        break;
      case 404:
        name = 'StabilityAIRecordNotFoundError';
        break;
    }

    this.name = name;
  }
}
