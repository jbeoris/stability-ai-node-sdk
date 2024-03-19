import axios from 'axios'
import { 
  APIVersion, 
  StabilityAIError,
} from "../util"
import * as Util from '../util'
import { APIContext } from '../util';

/**
 * Stability Get Balance (v1/user)
 */
export async function balance(args: APIContext): Promise<number> {
  const response = await axios.get(
    Util.makeUrl(APIVersion.V1, 'user', 'balance'),
    {
      headers: { Authorization: `Bearer ${args.apiKey}` },
    },
  );

  if (response.status === 200 && typeof response.data.credits === 'number') {
    return response.data.credits
  }
  
  throw new StabilityAIError(response.status, 'Failed to get user token balance', response.data);
}