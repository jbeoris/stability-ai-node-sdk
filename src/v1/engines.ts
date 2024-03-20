import axios from 'axios'
import { 
  APIVersion, 
  StabilityAIError,
} from "../util"
import * as SAIUtil from '../util'
import StabilityAI from '..';

const RESOURCE = 'engines';

enum Endpoints {
  LIST = 'list'
}

export interface Engine {
  description: string,
  id: string,
  name: string,
  type: 'AUDIO' | 'CLASSIFICATION' | 'PICTURE' | 'STORAGE' | 'TEXT' | 'VIDEO'
}

export type ListResponse = Promise<Engine[]>

/**
 * Stability List Engines (v1/engines)
 */
export async function list(this: StabilityAI): ListResponse {
  const response = await axios.get(
    SAIUtil.makeUrl(APIVersion.V1, RESOURCE, Endpoints.LIST),
    {
      headers: this.orgAuthHeaders,
    },
  );

  if (
    response.status === 200 && 
    Array.isArray(response.data)
  ) {
    return response.data
  }
  
  throw new StabilityAIError(response.status, 'Failed to get engines', response.data);
}