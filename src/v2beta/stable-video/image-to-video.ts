import axios from 'axios';
import fs from 'fs-extra';
import FormData from 'form-data';
import {
  APIVersion,
  StabilityAIError,
  StabilityAIContentResponse,
  StabilityAIStatusResult,
} from '../../util';
import * as Util from '../../util';
import StabilityAI from '../..';

const RESOURCE = 'image-to-video';

enum Endpoint {
  IMAGE_TO_VIDEO = '',
  IMAGE_TO_VIDEO_RESULT = 'result',
}

export type ImageToVideoRequest = [
  image: string,
  cfgScale?: number,
  motionBucketId?: number,
  options?: {
    seed?: number;
  },
];

export type ImageToVideoResponse = { id: string };

/**
 * Stability AI Stable Video Image to Video (v2beta)
 *
 * @param image - URL of the image to convert to video
 * @param options - Image to Video Options
 */
export async function imageToVideo(
  this: StabilityAI,
  image: string,
  cfgScale: number = 1.8,
  motionBucketId: number = 127,
  options?: {
    seed?: number;
  },
): Promise<ImageToVideoResponse> {
  const imageFilepath = await Util.downloadImage(image);

  const formData: {
    image: fs.ReadStream;
    motion_bucket_id: number;
    cfg_scale: number;
    seed?: number;
  } = {
    image: fs.createReadStream(imageFilepath),
    motion_bucket_id: motionBucketId,
    cfg_scale: cfgScale,
  };

  if (options?.seed) formData.seed = options.seed;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoint.IMAGE_TO_VIDEO),
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
    'Failed to start stable video image to video',
    response.data,
  );
}

export type ImageToVideoResultRequest = [id: string];

export type ImageToVideoResultResponse =
  | StabilityAIContentResponse
  | StabilityAIStatusResult;

/**
 * Stability AI Stable Video Image To Video Result (v2beta)
 *
 * @param id - ID of the upscale job
 */
export async function imageToVideoResult(
  this: StabilityAI,
  ...args: ImageToVideoResultRequest
): Promise<ImageToVideoResultResponse> {
  const [id] = args;
  const response = await axios.get(
    Util.makeUrl(
      APIVersion.V2_BETA,
      RESOURCE,
      Endpoint.IMAGE_TO_VIDEO_RESULT,
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
    return Util.processContentResponse(
      response.data,
      'mp4',
      'v2beta_image_to_video',
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
    'Failed to fetch stable video image to video result',
    response.data,
  );
}
