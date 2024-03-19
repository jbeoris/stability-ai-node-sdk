import _ from "lodash";
import * as V1User from './v1/user'
import * as V2AlphaGeneration from './v2alpha/generation'
import { APIContext } from "./util";

export type StabilityAIFailedNoRetry = 'failed-no-retry'

class StabilityAI {
  protected context: APIContext

  constructor(apiKey: string) {
    this.context = { apiKey }
  }

  // V1 User

  public get v1() {
    return {
      user: {
        balance: () => V1User.balance(this.context)
      }
    }
  }

  public get v2() {
    return {
      generation: {
        upscale: (args: V2AlphaGeneration.UpscaleOptions) => V2AlphaGeneration.upscale({...args, ...this.context}),
        upscaleResult: (args: V2AlphaGeneration.UpscaleResultOptions) => V2AlphaGeneration.upscaleResult({...args, ...this.context}),
        inpaint: (args: V2AlphaGeneration.InpaintOptions) => V2AlphaGeneration.inpaint({...args, ...this.context}),
        imageToVideo: (args: V2AlphaGeneration.ImageToVideoOptions) => V2AlphaGeneration.imageToVideo({...args, ...this.context}),
        imageToVideoResult: (args: V2AlphaGeneration.ImageToVideoResultOptions) => V2AlphaGeneration.imageToVideoResult({...args, ...this.context}),
      }
    }
  }
}

export default StabilityAI