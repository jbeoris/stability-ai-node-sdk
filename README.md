# stability-ai

A TypeScript / JavaScript library for the Stability AI REST API.

## Usage

```typescript
import StabilityAI from 'stability-ai';

export const stability = new StabilityAI(process.env.STABILITY_AI_API_KEY);

async function inpaintTest() {
  const result = await stability.v2.generation.inpaint({
    modeOptions: { mode: 'search', search_prompt: 'the earth' },
    image: 'https://live.staticflickr.com/7151/6760135001_58b1c5c5f0_b.jpg', // pictue of the earth from outer space
    prompt: 'disco ball'
  });

  if (!result) throw new Error('Failed to inpaint image!');

  return result.filepath;
};

inpaintText().then((filepath) => console.log('Path to inpainted image:', filepath)).catch(console.error);
```

## Development and testing

Built in TypeScript, tested with Jest.

```bash
$ yarn install
$ yarn test
```