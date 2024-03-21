import _ from 'lodash';
import * as V1User from './v1/user';
import * as V1Engines from './v1/engines';
import * as V1Generation from './v1/generation';
import * as V2BetaStableVideoImageToVideo from './v2beta/stable-video/image-to-video';
import * as V2BetaStableImageEdit from './v2beta/stable-image/edit';
import * as V2BetaStableImageGenerate from './v2beta/stable-image/generate';
import * as V2BetaStableImageUpscale from './v2beta/stable-image/upscale';
import { StabilityAIContentResponse, StabilityAIStatusResult } from './util';

class StabilityAI {
  private apiKey: string;
  private organiation?: string;
  private clientId?: string;
  private clientVersion?: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  protected get authHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  protected get orgAuthHeaders() {
    const headers: {
      Organization?: string;
      'Stability-Client-ID'?: string;
      'Stability-Client-Version'?: string;
    } = {};
    if (this.organiation) headers.Organization = this.organiation;
    if (this.clientId) headers['Stability-Client-ID'] = this.clientId;
    if (this.clientVersion)
      headers['Stability-Client-Version'] = this.clientVersion;
    return _.merge(this.authHeaders, headers);
  }

  public get v1() {
    return {
      user: {
        account: (): Promise<V1User.AccountResponse> =>
          V1User.account.bind(this)(),
        balance: (): Promise<V1User.BalanceResponse> =>
          V1User.balance.bind(this)(),
      },
      engines: {
        list: (): Promise<V1Engines.ListResponse> =>
          V1Engines.list.bind(this)(),
      },
      generation: {
        textToImage: (
          ...args: V1Generation.TextToImageOptions
        ): Promise<StabilityAIContentResponse[]> =>
          V1Generation.textToImage.bind(this)(...args),
        imageToImage: (
          ...args: V1Generation.ImageToImageOptions
        ): Promise<StabilityAIContentResponse[]> =>
          V1Generation.imageToImage.bind(this)(...args),
        imageToImageUpscale: (
          ...args: V1Generation.ImageToImageUpscaleOptions
        ): Promise<StabilityAIContentResponse[]> =>
          V1Generation.imageToImageUpscale.bind(this)(...args),
        imageToImageMasking: (
          ...args: V1Generation.ImageToImageMaskingOptions
        ): Promise<StabilityAIContentResponse[]> =>
          V1Generation.imageToImageMasking.bind(this)(...args),
      },
    };
  }

  public get v2beta() {
    return {
      stableVideo: {
        imageToVideo: (
          ...args: V2BetaStableVideoImageToVideo.ImageToVideoRequest
        ): Promise<V2BetaStableVideoImageToVideo.ImageToVideoResponse> =>
          V2BetaStableVideoImageToVideo.imageToVideo.bind(this)(...args),
        imageToVideoResult: (
          ...args: V2BetaStableVideoImageToVideo.ImageToVideoResultRequest
        ): Promise<V2BetaStableVideoImageToVideo.ImageToVideoResultResponse> =>
          V2BetaStableVideoImageToVideo.imageToVideoResult.bind(this)(...args),
      },
      stableImage: {
        edit: {
          inpaint: (
            ...args: V2BetaStableImageEdit.InpaintRequest
          ): Promise<StabilityAIContentResponse> =>
            V2BetaStableImageEdit.inpaint.bind(this)(...args),
          outpaint: (
            ...args: V2BetaStableImageEdit.OutpaintRequest
          ): Promise<StabilityAIContentResponse> =>
            V2BetaStableImageEdit.outpaint.bind(this)(...args),
          searchAndReplace: (
            ...args: V2BetaStableImageEdit.SearchAndReplaceRequest
          ): Promise<StabilityAIContentResponse> =>
            V2BetaStableImageEdit.searchAndReplace.bind(this)(...args),
          removeBackground: (
            ...args: V2BetaStableImageEdit.RemoveBackgroundRequest
          ): Promise<StabilityAIContentResponse> =>
            V2BetaStableImageEdit.removeBackground.bind(this)(...args),
        },
        generate: {
          core: (
            ...args: V2BetaStableImageGenerate.CoreRequest
          ): Promise<StabilityAIContentResponse> =>
            V2BetaStableImageGenerate.core.bind(this)(...args),
        },
        upscale: {
          creative: (
            ...args: V2BetaStableImageUpscale.CreativeUpscaleRequest
          ): Promise<V2BetaStableImageUpscale.CreativeUpscaleResponse> =>
            V2BetaStableImageUpscale.creativeUpscale.bind(this)(...args),
          creativeResult: (
            ...args: V2BetaStableImageUpscale.CreativeUpscaleResultRequest
          ): Promise<V2BetaStableImageUpscale.CreativeUpscaleResultResponse> =>
            V2BetaStableImageUpscale.creativeUpscaleResult.bind(this)(...args),
        },
      },
    };
  }
}

export default StabilityAI;
