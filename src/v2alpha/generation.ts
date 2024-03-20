import axios from 'axios';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';
import {
  OutputFormat,
  APIVersion,
  StabilityAIError,
  StabilityAIContentResult,
} from '../util';
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
  options?: {
    negative_prompt?: string;
    output_format?: OutputFormat;
    seed?: number;
    creativity?: number; // 0-0.35
  },
];

export type UpscaleRepsonse = { id: string; output_format: OutputFormat };

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
export async function upscale(
  this: StabilityAI,
  ...args: UpscaleOptions
): Promise<UpscaleRepsonse> {
  const [image, prompt, options] = args;
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

  if (options?.negative_prompt)
    formData.negative_prompt = options.negative_prompt;
  if (options?.output_format) formData.output_format = options.output_format;
  if (options?.seed) formData.seed = options.seed;
  if (options?.creativity) formData.creativity = options.creativity;

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
    return {
      id: response.data.id,
      output_format: options?.output_format || 'png',
    };
  }

  throw new StabilityAIError(
    response.status,
    'Failed to start upscale',
    response.data,
  );
}

export type UpscaleResultOptions = [id: string, outputFormat: OutputFormat];

export type UpscaleResultResponse =
  | StabilityAIContentResult
  | { id: string; status: 'in-progress' };

/**
 * Stability AI Stable Image Upscale Result (v2Alpha)
 *
 * @param id - ID of the upscale job
 * @param output_format - Output format requested in original upscale request
 * @returns
 */
export async function upscaleResult(
  this: StabilityAI,
  ...args: UpscaleResultOptions
): Promise<UpscaleResultResponse> {
  const [id, outputFormat] = args;
  const response = await axios.get(
    Util.makeUrl(
      APIVersion.V2_ALPHA,
      RESOURCE,
      Endpoints.STABLE_IMAGE_UPSCALE_RESULT,
    ) + `/${id}`,
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
    const finishReason: 'SUCCESS' | 'CONTENT_FILTERED' =
      response.data.finish_reason;

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

  throw new StabilityAIError(
    response.status,
    'Failed to fetch upscale result',
    response.data,
  );
}

export type InpaintOptions = [
  image: string,
  prompt: string,
  options: (
    | {
        mode: 'mask';
        mask?: string;
      }
    | {
        mode: 'search';
        search_prompt: string;
      }
  ) & {
    negative_prompt?: string;
    seed?: number;
    output_format?: OutputFormat;
  },
];

export type InpaintResponse = StabilityAIContentResult;

/**
 * Stability AI Stable Image Inpaint (v2Alpha)
 *
 * @param options - Inpaint Options
 */
export async function inpaint(
  this: StabilityAI,
  ...args: InpaintOptions
): Promise<InpaintResponse> {
  const [image, prompt, options] = args;
  const imageFilepath = await Util.downloadImage(image);
  const maskFilepath =
    options.mode === 'mask' && options.mask
      ? await Util.downloadImage(options.mask)
      : undefined;

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
    mode: options.mode,
    image: fs.createReadStream(imageFilepath),
    prompt,
  };
  if (options.negative_prompt)
    formData.negative_prompt = options.negative_prompt;
  if (options.seed) formData.seed = options.seed;
  if (options.output_format) formData.output_format = options.output_format;

  switch (options.mode) {
    case 'mask':
      if (maskFilepath) formData.mask = fs.createReadStream(maskFilepath);
      break;
    case 'search':
      formData.search_prompt = options.search_prompt;
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
    const finishReason: 'SUCCESS' | 'CONTENT_FILTERED' =
      response.data.finish_reason;

    const filename = `${uuidv4()}.${options.output_format || 'png'}`;
    const filepath = path.join(os.tmpdir(), filename);

    await fs.writeFile(filepath, image, 'base64');

    return {
      filepath,
      content_filtered: finishReason === 'CONTENT_FILTERED',
      errored: false,
      seed: response.data.seed,
    };
  }

  throw new StabilityAIError(
    response.status,
    'Failed to run inpaint',
    response.data,
  );
}

export type ImageToVideoOptions = [
  image: string,
  options?: {
    seed?: number;
    motion_bucket_id?: number;
    cfg_scale?: number;
  },
];

export type ImageToVideoResponse = { id: string };

/**
 * Stability AI Image to Video (v2Alpha)
 *
 * @param options - Image to Video Options
 */
export async function imageToVideo(
  this: StabilityAI,
  ...args: ImageToVideoOptions
): Promise<ImageToVideoResponse> {
  const [image, options] = args;
  const imageFilepath = await Util.downloadImage(image);

  const formData: {
    image: fs.ReadStream;
    seed?: number;
    motion_bucket_id?: number;
    cfg_scale?: number;
  } = {
    image: fs.createReadStream(imageFilepath),
  };
  if (options?.seed) formData.seed = options.seed;
  if (options?.motion_bucket_id)
    formData.motion_bucket_id = options.motion_bucket_id;
  if (options?.cfg_scale) formData.cfg_scale = options.cfg_scale;

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

  throw new StabilityAIError(
    response.status,
    'Failed to start image to video',
    response.data,
  );
}

export type ImageToVideoResultOptions = [id: string];

export type ImageToVideoResultResponse =
  | StabilityAIContentResult
  | { id: string; status: 'in-progress' };

/**
 * Stability AI Stable Image To Video Result (v2Alpha)
 *
 * @param id - ID of the upscale job
 * @returns
 */
export async function imageToVideoResult(
  this: StabilityAI,
  ...args: ImageToVideoResultOptions
): Promise<ImageToVideoResultResponse> {
  const [id] = args;
  const response = await axios.get(
    Util.makeUrl(
      APIVersion.V2_ALPHA,
      RESOURCE,
      Endpoints.IMAGE_TO_VIDEO_RESULT,
    ) + `/${id}`,
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
    const finishReason: 'SUCCESS' | 'CONTENT_FILTERED' =
      response.data.finish_reason;

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

  throw new StabilityAIError(
    response.status,
    'Failed to fetch image to video result',
    response.data,
  );
}
