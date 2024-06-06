import axios from 'axios';
import fs from 'fs-extra';
import FormData from 'form-data';
import {
  OutputFormat,
  APIVersion,
  StabilityAIError,
  StabilityAIContentResponse,
} from '../../util';
import * as Util from '../../util';
import StabilityAI from '../..';

const RESOURCE = 'stable-image/generate';

enum Endpoints {
  ULTRA = 'ultra',
  CORE = 'core',
  SD3 = 'sd3',
}

export type AspectRatio =
  | '16:9'
  | '1:1'
  | '21:9'
  | '2:3'
  | '3:2'
  | '4:5'
  | '5:4'
  | '9:16'
  | '9:21';

export type UltraRequest = [
  prompt: string,
  options?: {
    aspectRatio?: AspectRatio;
    negativePrompt?: string;
    seed?: number;
    outputFormat?: OutputFormat;
  },
];

/**
 * Stability AI Stable Image Generation Ultra (v2beta)
 *
 * @param options - Ultra Options
 */
export async function ultra(
  this: StabilityAI,
  ...args: UltraRequest
): Promise<StabilityAIContentResponse> {
  const [prompt, options] = args;

  const formData: any = {
    prompt,
  };

  if (options?.aspectRatio) formData.aspect_ratio = options.aspectRatio;
  if (options?.negativePrompt)
    formData.negative_prompt = options.negativePrompt;
  if (options?.seed) formData.seed = options.seed;
  if (options?.outputFormat) formData.output_format = options.outputFormat;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoints.ULTRA),
    axios.toFormData(formData, new FormData()),
    {
      validateStatus: undefined,
      headers: {
        ...this.authHeaders,
        Accept: 'application/json',
      },
    },
  );

  if (response.status === 200) {
    return Util.processContentResponse(
      response.data,
      options?.outputFormat || Util.DEFAULT_OUTPUT_FORMAT,
      'v2beta_stable_image_generate_ultra',
    );
  }

  throw new StabilityAIError(
    response.status,
    'Failed to stable image generation ultra',
    response.data,
  );
}

export type CoreRequest = [
  prompt: string,
  options?: {
    aspectRatio?: AspectRatio;
    negativePrompt?: string;
    seed?: number;
    outputFormat?: OutputFormat;
  },
];

/**
 * Stability AI Stable Image Generation Core (v2beta)
 *
 * @param options - Core Options
 */
export async function core(
  this: StabilityAI,
  ...args: CoreRequest
): Promise<StabilityAIContentResponse> {
  const [prompt, options] = args;

  const formData: any = {
    prompt,
  };

  if (options?.aspectRatio) formData.aspect_ratio = options.aspectRatio;
  if (options?.negativePrompt)
    formData.negative_prompt = options.negativePrompt;
  if (options?.seed) formData.seed = options.seed;
  if (options?.outputFormat) formData.output_format = options.outputFormat;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoints.CORE),
    axios.toFormData(formData, new FormData()),
    {
      validateStatus: undefined,
      headers: {
        ...this.authHeaders,
        Accept: 'application/json',
      },
    },
  );

  if (response.status === 200) {
    return Util.processContentResponse(
      response.data,
      options?.outputFormat || Util.DEFAULT_OUTPUT_FORMAT,
      'v2beta_stable_image_generate_core',
    );
  }

  throw new StabilityAIError(
    response.status,
    'Failed to stable image generation core',
    response.data,
  );
}

export type SD3Request = [
  prompt: string,
  options?: {
    model?: 'sd3' | 'sd3-turbo';
    seed?: number;
    outputFormat?: 'jpeg' | 'png';
  } & (
    | {
        mode: 'text-to-image';
        aspectRatio?: AspectRatio;
      }
    | {
        mode: 'image-to-image';
        image: string;
        strength: number;
      }
  ) &
    (
      | {
          model: 'sd3-turbo';
        }
      | {
          model?: 'sd3';
          negativePrompt?: string;
        }
    ),
];

/**
 * Stability AI Stable Image Generation SD3 (v2beta)
 *
 * @param options - SD3 (StableDiffusion 3) Options
 */
export async function sd3(
  this: StabilityAI,
  ...args: SD3Request
): Promise<StabilityAIContentResponse> {
  const [prompt, options] = args;
  let filepath: string | undefined = undefined;

  const formData: any = {
    prompt,
  };

  // general options
  if (options?.mode) formData.mode = options.mode;
  if (options?.model) formData.model = options.model;
  if (options?.seed) formData.seed = options.seed;
  if (options?.outputFormat) formData.output_format = options.outputFormat;

  switch (options?.mode) {
    case 'image-to-image':
      filepath = await Util.downloadImage(options.image);
      formData.strength = options.strength;
      formData.image = fs.createReadStream(filepath);
      break;
    case 'text-to-image':
    default:
      if (options?.aspectRatio) formData.aspect_ratio = options.aspectRatio;
      break;
  }

  switch (options?.model) {
    case 'sd3-turbo':
      break;
    case 'sd3':
    default:
      if (options?.negativePrompt)
        formData.negative_prompt = options.negativePrompt;
      break;
  }

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoints.SD3),
    axios.toFormData(formData, new FormData()),
    {
      validateStatus: undefined,
      headers: {
        ...this.authHeaders,
        Accept: 'application/json',
      },
    },
  );

  if (filepath) fs.unlinkSync(filepath);

  if (response.status === 200) {
    return Util.processContentResponse(
      response.data,
      options?.outputFormat || Util.DEFAULT_OUTPUT_FORMAT,
      'v2beta_stable_image_generate_sd3',
    );
  }

  throw new StabilityAIError(
    response.status,
    'Failed to stable image generation sd3',
    response.data,
  );
}
