import axios from 'axios'
import fs from "fs-extra";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';
import { 
  APIContext,
  OutputFormat, 
  APIVersion, 
  StabilityAIError,
  StabilityAIContentResult
} from "../util"
import * as Util from '../util'

const RESOURCE = 'generation';

enum Endpoints {
  BALANCE = 'https://api.stability.ai/v1/user/balance',
  STABLE_IMAGE_UPSCALE = 'stable-image/upscale',
  STABLE_IMAGE_UPSCALE_RESULT = 'stable-image/upscale/result',
  STABLE_IMAGE_INPAINT = 'stable-image/inpaint',
  IMAGE_TO_VIDEO = 'image-to-video',
  IMAGE_TO_VIDEO_RESULT = 'image-to-video/result',
}

export interface UpscaleOptions {
  image: string
  prompt: string
  negative_prompt?: string
  output_format?: OutputFormat
  seed?: number
  creativity?: number // 0-0.35
}

/**
 * Stability AI Stable Image Upscale (v2Alpha)
 * 
 * @param image - URL of the image to upscale
 * @param prompt - Prompt to use for upscaling
 * @param options - Additional options for upscaling
 */
export async function upscale(
  args: APIContext & UpscaleOptions
): Promise<{id: string, output_format: OutputFormat}> {
  const filepath = await Util.downloadImage(args.image)

  let formData: any = {
    image: fs.createReadStream(filepath),
    prompt: args.prompt
  }

  if (args.negative_prompt) formData['negative_prompt'] = args.negative_prompt
  if (args.output_format) formData['output_format'] = args.output_format
  if (args.seed) formData['seed'] = args.seed
  if (args.creativity) formData['creativity'] = args.creativity

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_ALPHA, RESOURCE, Endpoints.STABLE_IMAGE_UPSCALE),
    axios.toFormData(formData, new FormData()),
    {
      validateStatus: undefined,
      headers: { Authorization: `Bearer ${args.apiKey}` },
    },
  );

  fs.unlinkSync(filepath)

  if (
    response.status === 200 &&
    typeof response.data.id === 'string'
  ) {
    return {id: response.data.id, output_format: args.output_format || 'png'}
  }

  throw new StabilityAIError(response.status, 'Failed to start upscale', response.data);
}

export interface UpscaleResultOptions {
  id: string
  output_format: OutputFormat
}

/**
 * Stability AI Stable Image Upscale Result (v2Alpha)
 * 
 * @param id - ID of the upscale job
 * @param output_format - Output format requested in original upscale request
 * @returns 
 */
export async function upscaleResult(
  args: APIContext & UpscaleResultOptions
): 
  Promise<
    StabilityAIContentResult | 
    {id: string, status: 'in-progress'}
  > 
{
  const response = await axios.get(
    Util.makeUrl(
      APIVersion.V2_ALPHA, RESOURCE, 
      Endpoints.STABLE_IMAGE_UPSCALE_RESULT
    ) + `/${args.id}`,
    {
      validateStatus: undefined,
      headers: { 
        Authorization: `Bearer ${args.apiKey}`,
        Accept: 'application/json'
      },
    }
  );

  if (response.status === 200) {
    const image = response.data.image
    const finishReason: 'SUCCESS' | 'CONTENT_FILTERED' = response.data.finish_reason

    const filename = `${uuidv4()}.${args.output_format || 'png'}`
    const filepath = path.join(
      os.tmpdir(),
      filename
    );

    await fs.writeFile(filepath, image, 'base64')

    return { 
      filepath,
      content_filtered: finishReason === 'CONTENT_FILTERED' 
    }
  } else if (
    response.status === 202 &&
    typeof response.data.id === 'string' &&
    response.data.status === 'in-progress'
  ) {
    const {id, status} = response.data
    return {id, status}
  }

  throw new StabilityAIError(response.status, 'Failed to fetch upscale result', response.data);
}

export interface InpaintOptions {
  modeOptions: { mode: 'mask', mask?: string } | { mode: 'search', search_prompt: string },
  image: string,
  prompt: string,
  negative_prompt?: string,
  seed?: number,
  output_format?: OutputFormat
}

/**
 * Stability AI Stable Image Inpaint (v2Alpha)
 * 
 * @param options - Inpaint Options
 */
export async function inpaint(
  args: APIContext & InpaintOptions
): Promise<StabilityAIContentResult> {
  const image_filepath = await Util.downloadImage(args.image)
  const mask_filepath = (args.modeOptions.mode === 'mask' && args.modeOptions.mask) ? 
    await Util.downloadImage(args.modeOptions.mask) : undefined

  let formData: any = {
    mode: args.modeOptions.mode,
    image: fs.createReadStream(image_filepath),
    prompt: args.prompt
  }
  if (args.negative_prompt) formData['negative_prompt'] = args.negative_prompt
  if (args.seed) formData['seed'] = args.seed
  if (args.output_format) formData['output_format'] = args.output_format

  switch (args.modeOptions.mode) {
    case 'mask':
      if (mask_filepath) formData['mask'] = fs.createReadStream(mask_filepath)
      break;
    case 'search':
      formData['search_prompt'] = args.modeOptions.search_prompt
      break;
  }

  // response will have id as string
  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_ALPHA, RESOURCE, Endpoints.STABLE_IMAGE_INPAINT),
    axios.toFormData(formData, new FormData()),
    {
      validateStatus: undefined,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${args.apiKey}` 
      },
    },
  );

  // clean up temp files
  fs.unlinkSync(image_filepath)
  if (mask_filepath) fs.unlinkSync(mask_filepath)

  if (response.status === 200) {
    const image = response.data.image
    const finishReason: 'SUCCESS' | 'CONTENT_FILTERED' = response.data.finish_reason

    const filename = `${uuidv4()}.${args.output_format || 'png'}`
    const filepath = path.join(
      os.tmpdir(),
      filename
    );

    await fs.writeFile(filepath, image, 'base64')

    return { 
      filepath,
      content_filtered: finishReason === 'CONTENT_FILTERED' 
    }
  }

  throw new StabilityAIError(response.status, 'Failed to run inpaint', response.data);
}

export interface ImageToVideoOptions {
  image: string,
  seed?: number,
  motion_bucket_id?: number,
  cfg_scale?: number
}

/**
 * Stability AI Image to Video (v2Alpha)
 * 
 * @param options - Image to Video Options
 */
export async function imageToVideo(
  args: APIContext & ImageToVideoOptions
): Promise<{id: string}> {
  const image_filepath = await Util.downloadImage(args.image)

  let formData: any = {
    image: fs.createReadStream(image_filepath)
  }
  if (args.seed) formData['seed'] = args.seed
  if (args.motion_bucket_id) formData['motion_bucket_id'] = args.motion_bucket_id
  if (args.cfg_scale) formData['cfg_scale'] = args.cfg_scale

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_ALPHA, RESOURCE, Endpoints.IMAGE_TO_VIDEO),
    axios.toFormData(formData, new FormData()),
    {
      validateStatus: undefined,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${args.apiKey}` 
      },
    },
  );

  fs.unlinkSync(image_filepath)

  if (response.status === 200 && typeof response.data.id === 'string') {
    return {id: response.data.id}
  }

  throw new StabilityAIError(response.status, 'Failed to start image to video', response.data);
}

export interface ImageToVideoResultOptions {
  id: string
}

/**
 * Stability AI Stable Image To Video Result (v2Alpha)
 * 
 * @param id - ID of the upscale job
 * @returns 
 */
export async function imageToVideoResult(
  args: APIContext & ImageToVideoResultOptions
): 
  Promise<
    StabilityAIContentResult | 
    {id: string, status: 'in-progress'}
  > 
{
  const response = await axios.get(
    Util.makeUrl(
      APIVersion.V2_ALPHA, RESOURCE, 
      Endpoints.IMAGE_TO_VIDEO_RESULT
    ) + `/${args.id}`,
    {
      validateStatus: undefined,
      headers: { 
        Authorization: `Bearer ${args.apiKey}`,
        Accept: 'application/json'
      },
    }
  );

  if (response.status === 200) {
    const video = response.data.video
    const finishReason: 'SUCCESS' | 'CONTENT_FILTERED' = response.data.finish_reason

    const filename = `${uuidv4()}.mp4`
    const filepath = path.join(
      os.tmpdir(),
      filename
    );

    await fs.writeFile(filepath, video, 'base64')

    return { 
      filepath,
      content_filtered: finishReason === 'CONTENT_FILTERED' 
    }
  } else if (
    response.status === 202 &&
    typeof response.data.id === 'string' &&
    response.data.status === 'in-progress'
  ) {
    const {id, status} = response.data
    return {id, status}
  }

  throw new StabilityAIError(response.status, 'Failed to fetch image to video result', response.data);
}