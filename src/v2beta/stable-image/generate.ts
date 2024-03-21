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
  StabilityAIContentResponse,
} from '../../util';
import * as Util from '../../util';
import StabilityAI from '../..';

const RESOURCE = 'stable-image/generate';

enum Endpoints {
  CORE = 'core',
}

export type AspectRatio = '16:9' | '1:1' | '21:9' | '2:3' | '3:2' |' 4:5' | '5:4' | '9:16' |' 9:21';

export type CoreRequest = [
  prompt: string,
  options?: {
    aspectRatio?: AspectRatio,
    negativePrompt?: string,
    seed?: number,
    outputFormat?: OutputFormat
  }
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
    prompt
  };

  if (options?.aspectRatio) formData.aspect_ratio = options.aspectRatio;
  if (options?.negativePrompt) formData.negative_prompt = options.negativePrompt;
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
      'v2beta_stable_image_generate_core'
    );
  }

  throw new StabilityAIError(
    response.status,
    'Failed to stable image generation core',
    response.data,
  );
}