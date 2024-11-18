import axios from 'axios';
import {
  APIVersion,
  StabilityAIContentResponse,
  StabilityAIStatusResult
} from '../../util';
import { StabilityAIError } from '../../error';
import * as Util from '../../util';
import StabilityAI from '../..';

const RESOURCE = 'results';

enum Endpoint {
  FETCH_ASYNC_GENERATION_RESULT = '',
}

export type FetchAsyncGenerationResultRequest = [
  id: string
];

export type FetchAsyncGenerationResultResponse = 
| StabilityAIContentResponse
| StabilityAIStatusResult;

/**
 * Fetch the result of an async generation by ID
 * Results are stored for 24 hours after generation
 *
 * @param id - The ID of the generation to fetch (64 characters)
 * @returns A promise resolving to the generation result
 */
export async function fetchAsyncGenerationResult(
  this: StabilityAI,
  ...args: FetchAsyncGenerationResultRequest
): Promise<FetchAsyncGenerationResultResponse> {
  const [id] = args;

  let response = await axios.get(
    Util.makeUrl(APIVersion.V2_BETA, RESOURCE, Endpoint.FETCH_ASYNC_GENERATION_RESULT) +
    `/${id}`,
    {
      validateStatus: undefined,
      headers: {
        ...this.authHeaders,
        Accept: 'application/json; type=image/png'
      },
    },
  );

  if (response.status === 200) {
    return Util.processContentResponse(
      response.data,
      Util.DEFAULT_OUTPUT_FORMAT,
      'v2beta_fetch_async_result',
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
    'Failed to fetch generation result',
    response.data,
  );
}