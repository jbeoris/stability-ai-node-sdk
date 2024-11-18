import axios from 'axios';
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
  contentType: 'image' | 'video' | '3d';
  outputFormat: OutputFormat | 'mp4' | 'glb';
  contentFiltered: boolean;
  errored: boolean;
  seed: number;
};

export type StabilityAIStatusResult = {
  id: string;
  status: 'in-progress';
};

// HELPER FUNCTIONS

export function makeUrl(
  verison: APIVersion,
  resource: string,
  endpoint: string,
) {
  return `${STABILITY_AI_BASE_URL}/${verison}/${resource}${endpoint.length > 0 ? `/${endpoint}` : ''}`;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidFile(value: string): boolean {
  try {
    return fs.statSync(value).isFile();
  } catch {
    return false;
  }
}

export class ImagePath {
  private resource: string;
  private downloadFilepath?: string;
  private type: 'download' | 'local';

  constructor(resource: string) {
    this.resource = resource;
    if (isValidHttpUrl(resource)) {
      this.type = 'download';
    } else if (isValidFile(resource)) {
      this.type = 'local';
    } else {
      throw new Error(
        'Invalid image resource. Must be local filepath or public image URL.',
      );
    }
  }

  async filepath() {
    switch (this.type) {
      case 'local': {
        return this.resource;
      }
      case 'download': {
        if (this.downloadFilepath) return this.downloadFilepath;

        this.downloadFilepath = await downloadImage(this.resource);
        return this.downloadFilepath;
      }
    }
  }

  cleanup() {
    switch (this.type) {
      case 'download': {
        if (this.downloadFilepath) {
          fs.unlinkSync(this.downloadFilepath);
          this.downloadFilepath = undefined;
        }
        break;
      }
      default: {
        break;
      }
    }
  }
}

/**
 * Download an image from a URL and return the local file path
 *
 * @param url
 * @returns filepath string
 *
 * TODO - image type validation and use corresponding image filetype in filename
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
  await new Promise((resolve, reject) => {
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

export async function processArrayBufferResponse(
  data: any,
  outputFormat: 'glb',
  resource: string,
): Promise<StabilityAIContentResponse> {
  const filename = `${resource}_${uuidv4()}.${outputFormat}`;
  const filepath = path.join(os.tmpdir(), filename);

  await fs.writeFile(filepath, Buffer.from(data));

  return {
    filepath,
    filename,
    contentType: '3d',
    outputFormat,
    contentFiltered: false,
    errored: false,
    seed: data.seed,
  };
}

export async function processContentResponse(
  data: any,
  outputFormat: OutputFormat | 'mp4',
  resource: string,
): Promise<StabilityAIContentResponse> {
  let fileData = outputFormat === 'mp4' ? data.video : data.image;
  if (!fileData) fileData = data.base64;
  if (!fileData && data.result) fileData = data.result;
  if (!fileData) throw new Error('No file data found in response');
  const finishReason: 'SUCCESS' | 'CONTENT_FILTERED' | 'ERROR' =
    data.finish_reason;

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
