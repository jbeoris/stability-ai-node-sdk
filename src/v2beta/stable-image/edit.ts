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

const RESOURCE = 'stable-image/edit';

enum Endpoints {
  INPAINT = 'inpaint',
  OUTPAINT = 'outpaint',
  SEARCH_AND_REPLACE = 'search-and-replace',
  REMOVE_BACKGROUND = 'remove-background',
}

export type InpaintRequest = [
  image: string,
  prompt: string,
  options?: {
    mask?: string;
    negativePrompt?: string;
    seed?: number;
    outputFormat?: OutputFormat;
  },
];

/**
 * Stability AI Stable Image Inpaint (v2beta)
 *
 * @param image - URL of the image to inpaint
 * @param prompt - Prompt to use for inpainting
 * @param options - Inpaint Options
 */
export async function inpaint(
  this: StabilityAI,
  ...args: InpaintRequest
): Promise<StabilityAIContentResponse> {
  const [image, prompt, options] = args;
  const imageFilepath = await Util.downloadImage(image);
  const maskFilepath = options?.mask
    ? await Util.downloadImage(options.mask)
    : undefined;

  const formData: {
    image: fs.ReadStream;
    prompt: string;
    mask?: fs.ReadStream;
    negative_prompt?: string;
    seed?: number;
    output_format?: OutputFormat;
  } = {
    image: fs.createReadStream(imageFilepath),
    prompt,
  };

  if (maskFilepath) formData.mask = fs.createReadStream(maskFilepath);
  if (options?.negativePrompt)
    formData.negative_prompt = options.negativePrompt;
  if (options?.seed) formData.seed = options.seed;
  if (options?.outputFormat) formData.output_format = options.outputFormat;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoints.INPAINT),
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
    return Util.processContentResponse(
      response.data,
      options?.outputFormat || Util.DEFAULT_OUTPUT_FORMAT,
      'v2beta_stable_image_edit_inpaint',
    );
  }

  throw new StabilityAIError(
    response.status,
    'Failed to run stable image inpaint',
    response.data,
  );
}

export type OutpaintRequest = [
  image: string,
  options: {
    prompt?: string;
    seed?: number;
    outputFormat?: OutputFormat;
  } & (
    | {
        left: number;
        right?: number;
        up?: number;
        down?: number;
      }
    | {
        left?: number;
        right: number;
        up?: number;
        down?: number;
      }
    | {
        left?: number;
        right?: number;
        up: number;
        down?: number;
      }
    | {
        left?: number;
        right?: number;
        up?: number;
        down: number;
      }
  ),
];

/**
 * Stability AI Stable Image Outpaint (v2beta)
 *
 * @param image - URL of the image to outpaint
 * @param prompt - Prompt to use for outpainting
 * @param options - Outpaint Options
 */
export async function outpaint(
  this: StabilityAI,
  ...args: OutpaintRequest
): Promise<StabilityAIContentResponse> {
  const [image, options] = args;
  const imageFilepath = await Util.downloadImage(image);

  const formData: {
    image: fs.ReadStream;
    left?: number;
    right?: number;
    up?: number;
    down?: number;
    prompt?: string;
    seed?: number;
    output_format?: OutputFormat;
  } = {
    image: fs.createReadStream(imageFilepath),
  };

  if (options?.left) formData.left = options.left;
  if (options?.right) formData.right = options.right;
  if (options?.up) formData.up = options.up;
  if (options?.down) formData.down = options.down;
  if (options?.prompt) formData.prompt = options.prompt;
  if (options?.seed) formData.seed = options.seed;
  if (options?.outputFormat) formData.output_format = options.outputFormat;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoints.OUTPAINT),
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

  if (response.status === 200) {
    return Util.processContentResponse(
      response.data,
      options?.outputFormat || Util.DEFAULT_OUTPUT_FORMAT,
      'v2beta_stable_image_edit_outpaint',
    );
  }

  throw new StabilityAIError(
    response.status,
    'Failed to run stable image outpaint',
    response.data,
  );
}

export type SearchAndReplaceRequest = [
  image: string,
  prompt: string,
  searchPrompt: string,
  options?: {
    negativePrompt?: string;
    seed?: number;
    outputFormat?: OutputFormat;
  },
];

/**
 * Stability AI Stable Image Search and Replace (v2beta)
 *
 * @param image - URL of the image to search and replace
 * @param prompt - Prompt to use for search and replace
 * @param searchPrompt - Prompt to search for
 * @param options - Search and Replace Options
 */
export async function searchAndReplace(
  this: StabilityAI,
  ...args: SearchAndReplaceRequest
): Promise<StabilityAIContentResponse> {
  const [image, prompt, searchPrompt, options] = args;
  const imageFilepath = await Util.downloadImage(image);

  const formData: {
    image: fs.ReadStream;
    prompt: string;
    search_prompt: string;
    negative_prompt?: string;
    seed?: number;
    output_format?: OutputFormat;
  } = {
    image: fs.createReadStream(imageFilepath),
    prompt,
    search_prompt: searchPrompt,
  };

  if (options?.negativePrompt)
    formData.negative_prompt = options.negativePrompt;
  if (options?.seed) formData.seed = options.seed;
  if (options?.outputFormat) formData.output_format = options.outputFormat;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoints.SEARCH_AND_REPLACE),
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

  if (response.status === 200) {
    return Util.processContentResponse(
      response.data,
      options?.outputFormat || Util.DEFAULT_OUTPUT_FORMAT,
      'v2beta_stable_image_edit_search_and_replace',
    );
  }

  throw new StabilityAIError(
    response.status,
    'Failed to run stable image search and replace',
    response.data,
  );
}

export type RemoveBackgroundRequest = [
  image: string,
  options?: {
    outputFormat?: OutputFormat;
  },
];

/**
 * Stability AI Stable Image Remove Background (v2beta)
 *
 * @param image - URL of the image to remove the background from
 * @param options - Remove Background Options
 */
export async function removeBackground(
  this: StabilityAI,
  ...args: RemoveBackgroundRequest
): Promise<StabilityAIContentResponse> {
  const [image, options] = args;
  const imageFilepath = await Util.downloadImage(image);

  const formData: {
    image: fs.ReadStream;
    output_format?: OutputFormat;
  } = {
    image: fs.createReadStream(imageFilepath),
  };

  if (options?.outputFormat) formData.output_format = options.outputFormat;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoints.REMOVE_BACKGROUND),
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

  if (response.status === 200) {
    return Util.processContentResponse(
      response.data,
      options?.outputFormat || Util.DEFAULT_OUTPUT_FORMAT,
      'v2beta_stable_image_edit_remove_background',
    );
  }

  throw new StabilityAIError(
    response.status,
    'Failed to run stable image remove background',
    response.data,
  );
}
