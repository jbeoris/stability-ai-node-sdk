// ERROR HANDLING

export type StabilityAIErrorName =
  | 'StabilityAIInvalidRequestError'
  | 'StabilityAIUnauthorizedError'
  | 'StabilityAIContentModerationError'
  | 'StabilityAIRecordNotFoundError'
  | 'StabilityAIUnknownError';

export class StabilityAIError extends Error {
  constructor(status: number, message: string, data?: object) {
    let dataMessage: string;

    try {
      dataMessage = JSON.stringify(data);
    } catch {
      dataMessage = '';
    }

    const fullMessage = `${message}: ${dataMessage}`;

    super(fullMessage);

    let name: StabilityAIErrorName = 'StabilityAIUnknownError';

    switch (status) {
      case 400:
        name = 'StabilityAIInvalidRequestError';
        break;
      case 401:
        name = 'StabilityAIUnauthorizedError';
        break;
      case 403:
        name = 'StabilityAIContentModerationError';
        break;
      case 404:
        name = 'StabilityAIRecordNotFoundError';
        break;
    }

    this.name = name;
  }
}
