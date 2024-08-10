import axios from 'axios';
import { APIVersion } from '../util';
import { StabilityAIError } from '../error';
import * as SAIUtil from '../util';
import StabilityAI from '..';

const RESOURCE = 'engines';

enum Endpoint {
  LIST = 'list',
}

export interface Engine {
  description: string;
  id: string;
  name: string;
  type: 'AUDIO' | 'CLASSIFICATION' | 'PICTURE' | 'STORAGE' | 'TEXT' | 'VIDEO';
}

export type ListResponse = Engine[];

/**
 * Stability List Engines (v1/engines)
 */
export async function list(this: StabilityAI): Promise<ListResponse> {
  const response = await axios.get(
    SAIUtil.makeUrl(APIVersion.V1, RESOURCE, Endpoint.LIST),
    {
      headers: this.orgAuthHeaders,
    },
  );

  if (response.status === 200 && Array.isArray(response.data)) {
    return response.data;
  }

  throw new StabilityAIError(
    response.status,
    'Failed to get engines',
    response.data,
  );
}
