import axios from 'axios';
import fs from 'fs-extra';
import FormData from 'form-data';
import { APIVersion, StabilityAIContentResponse } from '../util';
import { StabilityAIError } from '../error';
import * as Util from '../util';
import StabilityAI from '..';

const RESOURCE = 'generation';

enum Endpoint {
  TEXT_TO_IMAGE = 'text-to-image',
  IMAGE_TO_IMAGE = 'image-to-image',
  IMAGE_TO_IMAGE_UPSCALE = 'image-to-image/upscale',
  IMAGE_TO_IMAGE_MASKING = 'image-to-image/masking',
}

export type EngineId =
  | 'stable-diffusion-v1-6'
  | 'stable-diffusion-xl-1024-v1-0';
export type ClipGuidancePreset =
  | 'FAST_BLUE'
  | 'FAST_GREEN'
  | 'NONE'
  | 'SIMPLE'
  | 'SLOW'
  | 'SLOWER'
  | 'SLOWEST';
export type Sampler =
  | 'DDIM'
  | 'DDPM'
  | 'K_DPMPP_2M'
  | 'K_DPMPP_2S_ANCESTRAL'
  | 'K_DPM_2'
  | 'K_DPM_2_ANCESTRAL'
  | 'K_EULER'
  | 'K_EULER_ANCESTRAL'
  | 'K_HEUN'
  | 'K_LMS';
export type StylePreset =
  | '3d-model'
  | 'analog-film'
  | 'anime'
  | 'cinematic'
  | 'comic-book'
  | 'digital-art'
  | 'enhance'
  | 'fantasy-art'
  | 'isometric'
  | 'line-art'
  | 'low-poly'
  | 'modeling-compound'
  | 'neon-punk'
  | 'origami'
  | 'photographic'
  | 'pixel-art'
  | 'tile-texture';
export type TextPrompt = { text: string; weight: number };

export type V1GenerationRequiredParams = [
  engine_id: EngineId,
  text_prompts: TextPrompt[],
];

export type V1GenerationOptionalParams = {
  cfg_scale?: number;
  clip_guidance_preset?: ClipGuidancePreset;
  sampler?: Sampler;
  samples?: number;
  seed?: number;
  steps?: number;
  style_preset?: StylePreset;
  extras?: object;
};

export type TextToImageOptions = [
  ...V1GenerationRequiredParams,
  options?: {
    height?: number;
    width?: number;
  } & V1GenerationOptionalParams,
];

async function processArtifacts(
  artifacts: any[],
): Promise<StabilityAIContentResponse[]> {
  const results: StabilityAIContentResponse[] = [];

  for (const artifact of artifacts) {
    const contentResponse = await Util.processContentResponse(
      artifact,
      'png',
      'v1_generation_text_to_image',
    );

    results.push(contentResponse);
  }

  return results;
}

/**
 * Stability AI Text To Image (v1)
 *
 * @param text_prompts - Text prompts to use for generating the image
 * @param options - Additional options for the generation
 */
export async function textToImage(
  this: StabilityAI,
  ...args: TextToImageOptions
): Promise<StabilityAIContentResponse[]> {
  const [engineId, textPrompts, options] = args;

  const body: any = {
    text_prompts: textPrompts,
    ...(options || {}),
  };

  const response = await axios.post(
    Util.makeUrl(
      APIVersion.V1,
      RESOURCE,
      engineId + '/' + Endpoint.TEXT_TO_IMAGE,
    ),
    body,
    {
      headers: {
        ...this.orgAuthHeaders,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      validateStatus: undefined,
    },
  );

  if (response.status === 200 && Array.isArray(response.data.artifacts)) {
    return processArtifacts(response.data.artifacts);
  }

  throw new StabilityAIError(
    response.status,
    'Failed to run text to image',
    response.data,
  );
}

export type ImageToImageOptions = [
  ...V1GenerationRequiredParams,
  init_image: string,
  options?: (
    | {
        mode: 'IMAGE_STRENGTH';
        image_strength?: number;
      }
    | {
        mode: 'STEP_SCHEDULE';
        step_schedule_start?: number;
        step_schedule_end?: number;
      }
  ) &
    V1GenerationOptionalParams,
];

/**
 * Stability AI Image To Image (v1)
 *
 */
export async function imageToImage(
  this: StabilityAI,
  ...args: ImageToImageOptions
): Promise<StabilityAIContentResponse[]> {
  const [engineId, textPrompts, initImage, options] = args;
  const imagePath = new Util.ImagePath(initImage);

  const formData: any = {
    init_image: fs.createReadStream(await imagePath.filepath()),
    text_prompts: textPrompts,
    ...(options || {}),
  };

  const response = await axios.postForm(
    Util.makeUrl(
      APIVersion.V1,
      RESOURCE,
      engineId + '/' + Endpoint.IMAGE_TO_IMAGE,
    ),
    axios.toFormData(formData, new FormData()),
    {
      validateStatus: undefined,
      headers: {
        ...this.authHeaders,
        Accept: 'application/json',
      },
    },
  );

  imagePath.cleanup();

  if (response.status === 200 && Array.isArray(response.data.artifacts)) {
    return processArtifacts(response.data.artifacts);
  }

  throw new StabilityAIError(
    response.status,
    'Failed to run image to image',
    response.data,
  );
}

export type ImageToImageMaskingOptions = [
  ...V1GenerationRequiredParams,
  init_image: string,
  options: (
    | {
        mask_source: 'MASK_IMAGE_WHITE' | 'MASK_IMAGE_BLACK';
        mask_image: string;
      }
    | {
        mask_source: 'INIT_IMAGE_ALPHA';
      }
  ) &
    V1GenerationOptionalParams,
];

/**
 * Stability AI Image To Image Upscale (v1)
 *
 */
export async function imageToImageMasking(
  this: StabilityAI,
  ...args: ImageToImageMaskingOptions
): Promise<StabilityAIContentResponse[]> {
  const [engineId, textPrompts, initImage, options] = args;
  const imagePath = new Util.ImagePath(initImage);
  let maskPath: Util.ImagePath | undefined = undefined;
  let otherOptions: any;

  if ('mask_image' in options) {
    maskPath = new Util.ImagePath(options.mask_image);
    const { ...other } = options;
    otherOptions = other;
  } else {
    const { ...other } = options;
    otherOptions = other;
  }

  const formData: any = {
    init_image: fs.createReadStream(await imagePath.filepath()),
    text_prompts: textPrompts,
    ...otherOptions,
  };

  if (maskPath)
    formData.mask_image = fs.createReadStream(await maskPath.filepath());

  const response = await axios.postForm(
    Util.makeUrl(
      APIVersion.V1,
      RESOURCE,
      engineId + '/' + Endpoint.IMAGE_TO_IMAGE_MASKING,
    ),
    axios.toFormData(formData, new FormData()),
    {
      validateStatus: undefined,
      headers: {
        ...this.authHeaders,
        Accept: 'application/json',
      },
    },
  );

  imagePath.cleanup();
  maskPath?.cleanup();

  if (response.status === 200 && Array.isArray(response.data.artifacts)) {
    return processArtifacts(response.data.artifacts);
  }

  throw new StabilityAIError(
    response.status,
    'Failed to run image to image masking',
    response.data,
  );
}
