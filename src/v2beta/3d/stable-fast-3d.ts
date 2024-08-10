import axios from 'axios';
import fs from 'fs-extra';
import FormData from 'form-data';
import {
  APIVersion,
  StabilityAIError,
  StabilityAIContentResponse
} from '../../util';
import * as Util from '../../util';
import StabilityAI from '../..';

const RESOURCE = '3d';

enum Endpoint {
  STABLE_FAST_3D = 'stable-fast-3d'
}

export type StableFast3DRequest = [
  image: string,
  options?: {
    textureResolution?: number,
    foregroundRatio?: number
  }
];

/**
 * Stability AI 3D Stable Fast 3D (v2beta)
 *
 * @param image - Local filepath or public URL of the image to make 3D
 * @param options - Stable Fast 3D Options
 */
export async function stableFast3D(
  this: StabilityAI,
  ...args: StableFast3DRequest
): Promise<StabilityAIContentResponse> {
  const [image, options] = args;
  const imagePath = new Util.ImagePath(image);

  const formData: {
    image: fs.ReadStream;
    texture_resolution?: number;
    foreground_ratio?: number;
  } = {
    image: fs.createReadStream(await imagePath.filepath())
  };

  if (options?.textureResolution) formData.texture_resolution = options.textureResolution;
  if (options?.foregroundRatio) formData.foreground_ratio = options.foregroundRatio;

  const response = await axios.postForm(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoint.STABLE_FAST_3D),
    axios.toFormData(formData, new FormData()),
    {
      validateStatus: undefined,
      responseType: "arraybuffer",
      headers: {
        ...this.authHeaders
      },
    },
  );

  imagePath.cleanup();

  if (response.status === 200) {
    return Util.processArrayBufferResponse(
      response.data,
      'glb',
      'v2beta_3d_stable_fast_3d',
    );
  }

  throw new StabilityAIError(
    response.status,
    'Failed: 3D Stable Fast 3D',
    response.data,
  );
}
