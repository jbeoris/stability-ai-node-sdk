import axios from 'axios';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';
import { OutputFormat, APIVersion, StabilityAIError, StabilityAIContentResult } from '../util';
import * as Util from '../util';
import StabilityAI from '..';

const RESOURCE = 'generation';

enum Endpoints {
  STABLE_IMAGE_UPSCALE = 'stable-image/upscale',
  STABLE_IMAGE_UPSCALE_RESULT = 'stable-image/upscale/result',
  STABLE_IMAGE_INPAINT = 'stable-image/inpaint',
  IMAGE_TO_VIDEO = 'image-to-video',
  IMAGE_TO_VIDEO_RESULT = 'image-to-video/result',
}

export type UpscaleOptions = [
  image: string,
  prompt: string,
  negativePrompt?: string,
  outputFormat?: OutputFormat,
  seed?: number,
  creativity?: number, // 0-0.35
];

export type UpscaleRepsonse = Promise<{ id: string; output_format: OutputFormat }>;

/**
 * Stability AI Stable Image Upscale (v2Alpha)
 *
 * @param image - URL of the image to upscale
 * @param prompt - Prompt to use for upscaling
 * @param negative_prompt - Negative prompt to use for upscaling
 * @param output_format - Output format of the upscaled image
 * @param seed - Seed for the upscaling
 * @param creativity - Creativity for the upscaling (0-0.35)
 */
export async function upscale(this: StabilityAI, ...args: UpscaleOptions): UpscaleRepsonse {
  const [image, prompt, negativePrompt, outputFormat, seed, creativity] = args;
  const filepath = await Util.downloadImage(image);

  const formData: {
    image: fs.ReadStream;
    prompt: string;
    negative_prompt?: string;
    output_format?: OutputFormat;
    seed?: number;
    creativity?: number;
  } = {
    image: fs.createReadStream(filepath),
    prompt,
  };

  if (negativePrompt) formData.negative_prompt = negativePrompt;
  if (outputFormat) formData.output_format = outputFormat;
  if (seed) formData.seed = seed;
  if (creativity) formData.creativity = creativity;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_ALPHA, RESOURCE, Endpoints.STABLE_IMAGE_UPSCALE),
    axios.toFormData(formData, new FormData()),
    {
      validateStatus: undefined,
      headers: this.authHeaders,
    },
  );

  fs.unlinkSync(filepath);

  if (response.status === 200 && typeof response.data.id === 'string') {
    return { id: response.data.id, output_format: outputFormat || 'png' };
  }

  throw new StabilityAIError(response.status, 'Failed to start upscale', response.data);
}

export type UpscaleResultOptions = [id: string, output_format: OutputFormat];

export type UpscaleResultResponse = Promise<StabilityAIContentResult | { id: string; status: 'in-progress' }>;

/**
 * Stability AI Stable Image Upscale Result (v2Alpha)
 *
 * @param id - ID of the upscale job
 * @param output_format - Output format requested in original upscale request
 * @returns
 */
export async function upscaleResult(this: StabilityAI, ...args: UpscaleResultOptions): UpscaleResultResponse {
  const [id, outputFormat] = args;
  const response = await axios.get(
    Util.makeUrl(APIVersion.V2_ALPHA, RESOURCE, Endpoints.STABLE_IMAGE_UPSCALE_RESULT) + `/${id}`,
    {
      validateStatus: undefined,
      headers: {
        ...this.authHeaders,
        Accept: 'application/json',
      },
    },
  );

  if (response.status === 200) {
    const image = response.data.image;
    const finishReason: 'SUCCESS' | 'CONTENT_FILTERED' = response.data.finish_reason;

    const filename = `${uuidv4()}.${outputFormat || 'png'}`;
    const filepath = path.join(os.tmpdir(), filename);

    await fs.writeFile(filepath, image, 'base64');

    return {
      filepath,
      content_filtered: finishReason === 'CONTENT_FILTERED',
      errored: false,
      seed: response.data.seed,
    };
  } else if (
    response.status === 202 &&
    typeof response.data.id === 'string' &&
    response.data.status === 'in-progress'
  ) {
    const { id, status } = response.data;
    return { id, status };
  }

  throw new StabilityAIError(response.status, 'Failed to fetch upscale result', response.data);
}

export type InpaintOptions = [
  modeOptions: { mode: 'mask'; mask?: string } | { mode: 'search'; search_prompt: string },
  image: string,
  prompt: string,
  negative_prompt?: string,
  seed?: number,
  output_format?: OutputFormat,
];

export type InpaintResponse = Promise<StabilityAIContentResult>;

/**
 * Stability AI Stable Image Inpaint (v2Alpha)
 *
 * @param options - Inpaint Options
 */
export async function inpaint(this: StabilityAI, ...args: InpaintOptions): InpaintResponse {
  const [modeOptions, image, prompt, negativePrompt, seed, outputFormat] = args;
  const imageFilepath = await Util.downloadImage(image);
  const maskFilepath =
    modeOptions.mode === 'mask' && modeOptions.mask ? await Util.downloadImage(modeOptions.mask) : undefined;

  const formData: {
    mode: string;
    image: fs.ReadStream;
    prompt: string;
    negative_prompt?: string;
    seed?: number;
    output_format?: OutputFormat;
    mask?: fs.ReadStream;
    search_prompt?: string;
  } = {
    mode: modeOptions.mode,
    image: fs.createReadStream(imageFilepath),
    prompt,
  };
  if (negativePrompt) formData.negative_prompt = negativePrompt;
  if (seed) formData.seed = seed;
  if (outputFormat) formData.output_format = outputFormat;

  switch (modeOptions.mode) {
    case 'mask':
      if (maskFilepath) formData.mask = fs.createReadStream(maskFilepath);
      break;
    case 'search':
      formData.search_prompt = modeOptions.search_prompt;
      break;
  }

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_ALPHA, RESOURCE, Endpoints.STABLE_IMAGE_INPAINT),
    axios.toFormData(formData, new FormData()),
    {
      validateStatus: undefined,
      headers: {
        ...this.authHeaders,
        Accept: 'application/json',
      },
    },
  );

  fs.unlinkSync(imageFilepath);
  if (maskFilepath) fs.unlinkSync(maskFilepath);

  if (response.status === 200) {
    const image = response.data.image;
    const finishReason: 'SUCCESS' | 'CONTENT_FILTERED' = response.data.finish_reason;

    const filename = `${uuidv4()}.${outputFormat || 'png'}`;
    const filepath = path.join(os.tmpdir(), filename);

    await fs.writeFile(filepath, image, 'base64');

    return {
      filepath,
      content_filtered: finishReason === 'CONTENT_FILTERED',
      errored: false,
      seed: response.data.seed,
    };
  }

  throw new StabilityAIError(response.status, 'Failed to run inpaint', response.data);
}

export type ImageToVideoOptions = [image: string, seed?: number, motion_bucket_id?: number, cfg_scale?: number];

export type ImageToVideoResponse = Promise<{ id: string }>;

/**
 * Stability AI Image to Video (v2Alpha)
 *
 * @param options - Image to Video Options
 */
export async function imageToVideo(this: StabilityAI, ...args: ImageToVideoOptions): ImageToVideoResponse {
  const [image, seed, motionBucketId, cfgScale] = args;
  const imageFilepath = await Util.downloadImage(image);

  const formData: {
    image: fs.ReadStream;
    seed?: number;
    motion_bucket_id?: number;
    cfg_scale?: number;
  } = {
    image: fs.createReadStream(imageFilepath),
  };
  if (seed) formData.seed = seed;
  if (motionBucketId) formData.motion_bucket_id = motionBucketId;
  if (cfgScale) formData.cfg_scale = cfgScale;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_ALPHA, RESOURCE, Endpoints.IMAGE_TO_VIDEO),
    axios.toFormData(formData, new FormData()),
    {
      validateStatus: undefined,
      headers: {
        ...this.authHeaders,
        Accept: 'application/json',
      },
    },
  );

  fs.unlinkSync(imageFilepath);

  if (response.status === 200 && typeof response.data.id === 'string') {
    return { id: response.data.id };
  }

  throw new StabilityAIError(response.status, 'Failed to start image to video', response.data);
}

export type ImageToVideoResultOptions = [id: string];

export type ImageToVideoResultResponse = Promise<StabilityAIContentResult | { id: string; status: 'in-progress' }>;

/**
 * Stability AI Stable Image To Video Result (v2Alpha)
 *
 * @param id - ID of the upscale job
 * @returns
 */
export async function imageToVideoResult(
  this: StabilityAI,
  ...args: ImageToVideoResultOptions
): ImageToVideoResultResponse {
  const [id] = args;
  const response = await axios.get(
    Util.makeUrl(APIVersion.V2_ALPHA, RESOURCE, Endpoints.IMAGE_TO_VIDEO_RESULT) + `/${id}`,
    {
      validateStatus: undefined,
      headers: {
        ...this.authHeaders,
        Accept: 'application/json',
      },
    },
  );

  if (response.status === 200) {
    const video = response.data.video;
    const finishReason: 'SUCCESS' | 'CONTENT_FILTERED' = response.data.finish_reason;

    const filename = `${uuidv4()}.mp4`;
    const filepath = path.join(os.tmpdir(), filename);

    await fs.writeFile(filepath, video, 'base64');

    return {
      filepath,
      content_filtered: finishReason === 'CONTENT_FILTERED',
      errored: false,
      seed: response.data.seed,
    };
  } else if (
    response.status === 202 &&
    typeof response.data.id === 'string' &&
    response.data.status === 'in-progress'
  ) {
    const { id, status } = response.data;
    return { id, status };
  }

  throw new StabilityAIError(response.status, 'Failed to fetch image to video result', response.data);
}
