import axios from 'axios';
import fs from 'fs-extra';
import FormData from 'form-data';
import {
  OutputFormat,
  APIVersion,
  StabilityAIContentResponse,
} from '../../util';
import { StabilityAIError } from '../../error';
import * as Util from '../../util';
import StabilityAI from '../..';

const RESOURCE = 'stable-image/edit';

enum Endpoint {
  ERASE = 'erase',
  INPAINT = 'inpaint',
  OUTPAINT = 'outpaint',
  SEARCH_AND_REPLACE = 'search-and-replace',
  REMOVE_BACKGROUND = 'remove-background',
}

export type EraseRequest = [
  image: string,
  options?: {
    mask?: string;
    seed?: number;
    outputFormat?: OutputFormat;
  },
];

/**
 * Stability AI Stable Image Erase (v2beta)
 *
 * @param image - Local filepath or public URL of the image to perform erase on
 * @param options - Erase Options
 */
export async function erase(
  this: StabilityAI,
  ...args: EraseRequest
): Promise<StabilityAIContentResponse> {
  const [image, options] = args;
  const imagePath = new Util.ImagePath(image);
  const maskPath = options?.mask ? new Util.ImagePath(options.mask) : undefined;

  const formData: {
    image: fs.ReadStream;
    mask?: fs.ReadStream;
    seed?: number;
    output_format?: OutputFormat;
  } = {
    image: fs.createReadStream(await imagePath.filepath()),
  };

  if (maskPath) formData.mask = fs.createReadStream(await maskPath.filepath());
  if (options?.seed) formData.seed = options.seed;
  if (options?.outputFormat) formData.output_format = options.outputFormat;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoint.ERASE),
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

  if (response.status === 200) {
    return Util.processContentResponse(
      response.data,
      options?.outputFormat || Util.DEFAULT_OUTPUT_FORMAT,
      'v2beta_stable_image_edit_erase',
    );
  }

  throw new StabilityAIError(
    response.status,
    'Failed to run stable image erase',
    response.data,
  );
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
 * @param image - Local filepath or public URL of the image to inpaint
 * @param prompt - Prompt to use for inpainting
 * @param options - Inpaint Options
 */
export async function inpaint(
  this: StabilityAI,
  ...args: InpaintRequest
): Promise<StabilityAIContentResponse> {
  const [image, prompt, options] = args;
  const imagePath = new Util.ImagePath(image);
  const maskPath = options?.mask ? new Util.ImagePath(options.mask) : undefined;

  const formData: {
    image: fs.ReadStream;
    prompt: string;
    mask?: fs.ReadStream;
    negative_prompt?: string;
    seed?: number;
    output_format?: OutputFormat;
  } = {
    image: fs.createReadStream(await imagePath.filepath()),
    prompt,
  };

  if (maskPath) formData.mask = fs.createReadStream(await maskPath.filepath());
  if (options?.negativePrompt)
    formData.negative_prompt = options.negativePrompt;
  if (options?.seed) formData.seed = options.seed;
  if (options?.outputFormat) formData.output_format = options.outputFormat;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoint.INPAINT),
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
 * @param image - Local filepath or public URL of the image to outpaint
 * @param prompt - Prompt to use for outpainting
 * @param options - Outpaint Options
 */
export async function outpaint(
  this: StabilityAI,
  ...args: OutpaintRequest
): Promise<StabilityAIContentResponse> {
  const [image, options] = args;
  const imagePath = new Util.ImagePath(image);

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
    image: fs.createReadStream(await imagePath.filepath()),
  };

  if (options?.left) formData.left = options.left;
  if (options?.right) formData.right = options.right;
  if (options?.up) formData.up = options.up;
  if (options?.down) formData.down = options.down;
  if (options?.prompt) formData.prompt = options.prompt;
  if (options?.seed) formData.seed = options.seed;
  if (options?.outputFormat) formData.output_format = options.outputFormat;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoint.OUTPAINT),
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
 * @param image - Local filepath or public URL of the image to search and replace
 * @param prompt - Prompt to use for search and replace
 * @param searchPrompt - Prompt to search for
 * @param options - Search and Replace Options
 */
export async function searchAndReplace(
  this: StabilityAI,
  ...args: SearchAndReplaceRequest
): Promise<StabilityAIContentResponse> {
  const [image, prompt, searchPrompt, options] = args;
  const imagePath = new Util.ImagePath(image);

  const formData: {
    image: fs.ReadStream;
    prompt: string;
    search_prompt: string;
    negative_prompt?: string;
    seed?: number;
    output_format?: OutputFormat;
  } = {
    image: fs.createReadStream(await imagePath.filepath()),
    prompt,
    search_prompt: searchPrompt,
  };

  if (options?.negativePrompt)
    formData.negative_prompt = options.negativePrompt;
  if (options?.seed) formData.seed = options.seed;
  if (options?.outputFormat) formData.output_format = options.outputFormat;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoint.SEARCH_AND_REPLACE),
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
 * @param image - Local filepath or public URL of the image to remove the background from
 * @param options - Remove Background Options
 */
export async function removeBackground(
  this: StabilityAI,
  ...args: RemoveBackgroundRequest
): Promise<StabilityAIContentResponse> {
  const [image, options] = args;
  const imagePath = new Util.ImagePath(image);

  const formData: {
    image: fs.ReadStream;
    output_format?: OutputFormat;
  } = {
    image: fs.createReadStream(await imagePath.filepath()),
  };

  if (options?.outputFormat) formData.output_format = options.outputFormat;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoint.REMOVE_BACKGROUND),
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

export type ReplaceBackgroundAndRelightRequest = [
  image: string,
  options?: {
    backgroundPrompt?: string;
    backgroundReference?: string;
    foregroundPrompt?: string;
    negativePrompt?: string;
    preserveOriginalSubject?: number;
    originalBackgroundDepth?: number;
    keepOriginalBackground?: boolean;
    lightSourceDirection?: 'above' | 'below' | 'left' | 'right';
    lightReference?: string;
    lightSourceStrength?: number;
    seed?: number;
    outputFormat?: OutputFormat;
  },
];

export type ReplaceBackgroundAndRelightResponse = {
  id: string;
};

/**
 * Stability AI Stable Image Replace Background and Relight (v2beta)
 *
 * @param image - Local filepath or public URL of the image containing the subject
 * @param options - Replace Background and Relight Options
 */
export async function replaceBackgroundAndRelight(
  this: StabilityAI,
  ...args: ReplaceBackgroundAndRelightRequest
): Promise<ReplaceBackgroundAndRelightResponse> {
  const [image, options] = args;
  const imagePath = new Util.ImagePath(image);
  const backgroundRefPath = options?.backgroundReference
    ? new Util.ImagePath(options.backgroundReference)
    : undefined;
  const lightRefPath = options?.lightReference
    ? new Util.ImagePath(options.lightReference)
    : undefined;

  const formData: Record<string, any> = {
    subject_image: fs.createReadStream(await imagePath.filepath()),
  };

  // Required: either background_reference or background_prompt
  if (backgroundRefPath) {
    formData.background_reference = fs.createReadStream(
      await backgroundRefPath.filepath(),
    );
  }
  if (options?.backgroundPrompt) {
    formData.background_prompt = options.backgroundPrompt;
  }

  // Optional parameters
  if (options?.foregroundPrompt)
    formData.foreground_prompt = options.foregroundPrompt;
  if (options?.negativePrompt)
    formData.negative_prompt = options.negativePrompt;
  if (options?.preserveOriginalSubject)
    formData.preserve_original_subject = options.preserveOriginalSubject;
  if (options?.originalBackgroundDepth)
    formData.original_background_depth = options.originalBackgroundDepth;
  if (options?.keepOriginalBackground)
    formData.keep_original_background = options.keepOriginalBackground;
  if (options?.lightSourceDirection)
    formData.light_source_direction = options.lightSourceDirection;
  if (lightRefPath) {
    formData.light_reference = fs.createReadStream(
      await lightRefPath.filepath(),
    );
  }
  if (options?.lightSourceStrength)
    formData.light_source_strength = options.lightSourceStrength;
  if (options?.seed) formData.seed = options.seed;
  if (options?.outputFormat) formData.output_format = options.outputFormat;

  const response = await axios.postForm(
    Util.makeUrl(
      APIVersion.V2_BETA,
      RESOURCE,
      'replace-background-and-relight',
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

  // Cleanup temporary files
  imagePath.cleanup();
  backgroundRefPath?.cleanup();
  lightRefPath?.cleanup();

  if (response.status === 200 && typeof response.data.id === 'string') {
    return { id: response.data.id };
  }

  throw new StabilityAIError(
    response.status,
    'Failed to run stable image replace background and relight',
    response.data,
  );
}
