import axios from 'axios';
import fs from 'fs-extra';
import FormData from 'form-data';
import {
  OutputFormat,
  APIVersion,
  StabilityAIError,
  StabilityAIContentResponse,
  StabilityAIStatusResult,
} from '../../util';
import * as Util from '../../util';
import StabilityAI from '../..';

const RESOURCE = 'stable-image/upscale';

enum Endpoints {
  CONSERVATIVE = 'conservative',
  CREATIVE = 'creative',
  CREATIVE_RESULT = 'creative/result',
}

export type ConservativeUpscaleRequest = [
  image: string,
  prompt: string,
  options?: {
    negativePrompt?: string;
    outputFormat?: OutputFormat;
    seed?: number;
    creativity?: number;
  },
];

/**
 * Stability AI Stable Image Conservative Upscale (v2beta)
 *
 * @param image - URL of the image to upscale
 * @param prompt - Prompt to use for upscaling
 * @param options - Extra options for the upscale
 */
export async function conservative(
  this: StabilityAI,
  ...args: ConservativeUpscaleRequest
): Promise<StabilityAIContentResponse> {
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

  if (options?.negativePrompt)
    formData.negative_prompt = options.negativePrompt;
  if (options?.outputFormat) formData.output_format = options.outputFormat;
  if (options?.seed) formData.seed = options.seed;
  if (options?.creativity) formData.creativity = options.creativity;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoints.CONSERVATIVE),
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
      'v2beta_stable_image_upscale_conservative',
    );
  }

  throw new StabilityAIError(
    response.status,
    'Failed to perform conservative upscale',
    response.data,
  );
}

export type CreativeUpscaleRequest = [
  image: string,
  prompt: string,
  options?: {
    negativePrompt?: string;
    outputFormat?: OutputFormat;
    seed?: number;
    creativity?: number;
  },
];

export type CreativeUpscaleResponse = {
  id: string;
  outputFormat: OutputFormat;
};

/**
 * Stability AI Stable Image Start Creative Upscale (v2beta)
 *
 * @param image - URL of the image to upscale
 * @param prompt - Prompt to use for upscaling
 * @param options - Extra options for the upscale
 */
export async function startCreative(
  this: StabilityAI,
  ...args: CreativeUpscaleRequest
): Promise<CreativeUpscaleResponse> {
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

  if (options?.negativePrompt)
    formData.negative_prompt = options.negativePrompt;
  if (options?.outputFormat) formData.output_format = options.outputFormat;
  if (options?.seed) formData.seed = options.seed;
  if (options?.creativity) formData.creativity = options.creativity;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoints.CREATIVE),
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
      outputFormat: options?.outputFormat || Util.DEFAULT_OUTPUT_FORMAT,
    };
  }

  throw new StabilityAIError(
    response.status,
    'Failed to start creative upscale',
    response.data,
  );
}

export type CreativeUpscaleResultRequest = [
  id: string,
  outputFormat: OutputFormat,
];

export type CreativeUpscaleResultResponse =
  | StabilityAIContentResponse
  | StabilityAIStatusResult;

/**
 * Stability AI Stable Image Fetch Creative Upscale Result (v2beta)
 *
 * @param id - ID of the upscale job
 * @param output_format - Output format requested in original upscale request
 * @returns
 */
export async function fetchCreativeResult(
  this: StabilityAI,
  ...args: CreativeUpscaleResultRequest
): Promise<CreativeUpscaleResultResponse> {
  const [id, outputFormat] = args;
  const response = await axios.get(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoints.CREATIVE_RESULT) +
      `/${id}`,
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
      outputFormat,
      'v2beta_stable_image_upscale_creative',
    );
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
    'Failed to fetch createive upscale result',
    response.data,
  );
}
