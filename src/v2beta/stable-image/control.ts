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
import { AspectRatio } from './generate';

const RESOURCE = 'stable-image/control';

enum Endpoint {
  SKETCH = 'sketch',
  STRUCTURE = 'structure',
  STYLE = 'style'
}

export type ControlRequest = [
  image: string,
  prompt: string,
  options?: {
    controlStrength?: number;
    negativePrompt?: string;
    seed?: number;
    outputFormat?: OutputFormat;
  },
];

/**
 * Stability AI Stable Image Control Sketch (v2beta)
 *
 * @param image - Local filepath or public URL of the image to control sketch
 * @param prompt - Prompt to use for control sketch
 * @param options - Control sketch Options
 */
export async function sketch(
  this: StabilityAI,
  ...args: ControlRequest
): Promise<StabilityAIContentResponse> {
  return control.call(this, Endpoint.SKETCH, ...args);
}

/**
 * Stability AI Stable Image Control Structure (v2beta)
 *
 * @param image - Local filepath or public URL of the image to control structure
 * @param prompt - Prompt to use for control structure
 * @param options - Control structure Options
 */
export async function structure(
  this: StabilityAI,
  ...args: ControlRequest
): Promise<StabilityAIContentResponse> {
  return control.call(this, Endpoint.STRUCTURE, ...args);
}

async function control(
  this: StabilityAI,
  endpoint: Endpoint,
  ...args: ControlRequest
): Promise<StabilityAIContentResponse> {
  const [image, prompt, options] = args;
  const imagePath = new Util.ImagePath(image);

  const formData: {
    image: fs.ReadStream;
    prompt: string;
    control_strength?: number;
    negative_prompt?: string;
    seed?: number;
    output_format?: OutputFormat;
  } = {
    image: fs.createReadStream(await imagePath.filepath()),
    prompt
  };

  if (options?.controlStrength) 
    formData.control_strength = options.controlStrength;
  if (options?.negativePrompt)
    formData.negative_prompt = options.negativePrompt;
  if (options?.seed) formData.seed = options.seed;
  if (options?.outputFormat) formData.output_format = options.outputFormat;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, endpoint),
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
      `v2beta_stable_image_control_${endpoint}`,
    );
  }

  throw new StabilityAIError(
    response.status,
    `Failed to run stable image control ${endpoint}`,
    response.data,
  );
}

export type ControlStyleRequest = [
  image: string,
  prompt: string,
  options?: {
    negativePrompt?: string;
    aspectRatio?: AspectRatio;
    fidelity?: number;
    seed?: number;
    outputFormat?: OutputFormat;
  },
];

/**
 * Stability AI Stable Image Control Style (v2beta)
 *
 * @param image - Local filepath or public URL of the image to control style
 * @param prompt - Prompt to use for control style
 * @param options - Control style Options
 */
export async function style(
  this: StabilityAI,
  ...args: ControlStyleRequest
): Promise<StabilityAIContentResponse> {
  const [image, prompt, options] = args;
  const imagePath = new Util.ImagePath(image);

  const formData: {
    image: fs.ReadStream;
    prompt: string;
    negative_prompt?: string;
    aspect_ratio?: string;
    fidelity?: number;
    seed?: number;
    output_format?: OutputFormat;
  } = {
    image: fs.createReadStream(await imagePath.filepath()),
    prompt
  };

  if (options?.negativePrompt)
    formData.negative_prompt = options.negativePrompt;
  if (options?.aspectRatio) 
    formData.aspect_ratio = options.aspectRatio;
  if (options?.fidelity) 
    formData.fidelity = options.fidelity;
  if (options?.seed) formData.seed = options.seed;
  if (options?.outputFormat) formData.output_format = options.outputFormat;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoint.STYLE),
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
      `v2beta_stable_image_control_style`,
    );
  }

  throw new StabilityAIError(
    response.status,
    `Failed to run stable image control style`,
    response.data,
  );
}