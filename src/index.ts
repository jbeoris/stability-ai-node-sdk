import _ from 'lodash';
import * as V1User from './v1/user';
import * as V1Engines from './v1/engines';
import * as V1Generation from './v1/generation';
import * as V2AlphaGeneration from './v2alpha/generation';

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
        ): Promise<V1Generation.ContentResultResponse> =>
          V1Generation.textToImage.bind(this)(...args),
        imageToImage: (
          ...args: V1Generation.ImageToImageOptions
        ): Promise<V1Generation.ContentResultResponse> =>
          V1Generation.imageToImage.bind(this)(...args),
        imageToImageUpscale: (
          ...args: V1Generation.ImageToImageUpscaleOptions
        ): Promise<V1Generation.ContentResultResponse> =>
          V1Generation.imageToImageUpscale.bind(this)(...args),
        imageToImageMasking: (
          ...args: V1Generation.ImageToImageMaskingOptions
        ): Promise<V1Generation.ContentResultResponse> =>
          V1Generation.imageToImageMasking.bind(this)(...args),
      },
    };
  }

  public get v2Alpha() {
    return {
      generation: {
        upscale: (
          ...args: V2AlphaGeneration.UpscaleOptions
        ): Promise<V2AlphaGeneration.UpscaleRepsonse> =>
          V2AlphaGeneration.upscale.bind(this)(...args),
        upscaleResult: (
          ...args: V2AlphaGeneration.UpscaleResultOptions
        ): Promise<V2AlphaGeneration.UpscaleResultResponse> =>
          V2AlphaGeneration.upscaleResult.bind(this)(...args),
        inpaint: (
          ...args: V2AlphaGeneration.InpaintOptions
        ): Promise<V2AlphaGeneration.InpaintResponse> =>
          V2AlphaGeneration.inpaint.bind(this)(...args),
        imageToVideo: (
          ...args: V2AlphaGeneration.ImageToVideoOptions
        ): Promise<V2AlphaGeneration.ImageToVideoResponse> =>
          V2AlphaGeneration.imageToVideo.bind(this)(...args),
        imageToVideoResult: (
          ...args: V2AlphaGeneration.ImageToVideoResultOptions
        ): Promise<V2AlphaGeneration.ImageToVideoResultResponse> =>
          V2AlphaGeneration.imageToVideoResult.bind(this)(...args),
      },
    };
  }
}

export default StabilityAI;
