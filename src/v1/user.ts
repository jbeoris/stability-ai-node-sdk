import axios from 'axios';
import { APIVersion, StabilityAIError } from '../util';
import * as SAIUtil from '../util';
import StabilityAI from '..';

const RESOURCE = 'user';

enum Endpoints {
  ACCOUNT = 'account',
  BALANCE = 'balance',
}

export interface Organizations {
  id: string;
  is_default: boolean;
  name: string;
  role: string;
}

export type AccountResponse = {
  email: string;
  id: string;
  organizations: Organizations[];
  profile_picture?: string;
};

/**
 * Stability Get Balance (v1/user)
 */
export async function account(this: StabilityAI): Promise<AccountResponse> {
  const response = await axios.get(
    SAIUtil.makeUrl(APIVersion.V1, RESOURCE, Endpoints.ACCOUNT),
    {
      headers: this.authHeaders,
    },
  );

  if (
    response.status === 200 &&
    typeof response.data.email === 'string' &&
    typeof response.data.id === 'string' &&
    Array.isArray(response.data.organizations)
  ) {
    return {
      email: response.data.email,
      id: response.data.id,
      organizations: response.data.organizations,
      profile_picture: response.data.profile_picture,
    };
  }

  throw new StabilityAIError(
    response.status,
    'Failed to get user account',
    response.data,
  );
}

export type BalanceResponse = { credits: number };

/**
 * Stability Get Balance (v1/user)
 */
export async function balance(this: StabilityAI): Promise<BalanceResponse> {
  const response = await axios.get(
    SAIUtil.makeUrl(APIVersion.V1, RESOURCE, Endpoints.BALANCE),
    {
      headers: this.orgAuthHeaders,
    },
  );

  if (response.status === 200 && typeof response.data.credits === 'number') {
    return {
      credits: response.data.credits,
    };
  }

  throw new StabilityAIError(
    response.status,
    'Failed to get user token balance',
    response.data,
  );
}
