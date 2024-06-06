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

const RESOURCE = 'stable-image/control';

enum Endpoint {
  SKETCH = 'sketch',
  STRUCTURE = 'structure'
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
 * @param image - URL of the image to control sketch
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
 * @param image - URL of the image to control structure
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
  const imageFilepath = await Util.downloadImage(image);

  const formData: {
    image: fs.ReadStream;
    prompt: string;
    control_strength?: number;
    negative_prompt?: string;
    seed?: number;
    output_format?: OutputFormat;
  } = {
    image: fs.createReadStream(imageFilepath),
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

  fs.unlinkSync(imageFilepath);

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