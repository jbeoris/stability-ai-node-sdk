# Stability AI Node SDK

A TypeScript library to easily access the Stability AI REST API.

## Installation

### Yarn
```bash
yarn add stability-ai
```
### NPM
```bash
npm i stability-ai
```

## General Usage

```typescript
import StabilityAI from 'stability-ai';

const stability = new StabilityAI(process.env.STABILITY_AI_API_KEY);
```

## User (v1)

### Account

```typescript
const { email, id, organizations, profile_picture } = await stability.v1.user.account()

console.log('User email:', email);
console.log('User id:', id);
console.log('User organizations:', organizations);
if (profile_picture) console.log('User profile picture:', profile_picture);
```

### Balance

```typescript
const { credits } = await stability.v1.user.balance()

console.log('User credits balance:', credits);
```

## Engines (v1)

### List

```typescript
const engines = await stability.v1.engines.list()

console.log('Engine list:', engines);
```

## Generation (v1)

### Text to Image

```typescript
const results = await stability.v1.generation.textToImage(
  'stable-diffusion-xl-beta-v2-2-2', 
  [
    { text: 'a man on a horse', weight: 0.5 }
  ]
)

for (const result of results) {
  console.log('Text to image result filepath:', result.filepath);
}
```

### Image to Image

```typescript
const results = await stability.v1.generation.imageToImage(
  'stable-diffusion-xl-beta-v2-2-2', 
  [
    { text: 'crazy techincolor surprise', weight: 0.5 }
  ],
  'https://www.example.com/images/your-image.jpg'
)

for (const result of results) {
  console.log('Image to image result filepath:', result.filepath);
}
```

### Image to Image - Upscale

```typescript
const results = await stability.v1.generation.imageToImageUpscale(
  'https://www.example.com/images/your-image.jpg',
  {
    type: 'esrgan'
  }
)

for (const result of results) {
  console.log('Image to image upscale result filepath:', result.filepath);
}
```

### Image to Image - Masking

```typescript
const results = await stability.v1.generation.imageToImageMasking(
  'stable-diffusion-xl-beta-v2-2-2', 
  [
    { text: 'a beautiful ocean', weight: 0.5 }
  ],
  'https://www.example.com/images/your-image-with-alpha-channel.png',
  {
    mask_source: 'INIT_IMAGE_ALPHA'
  }
)

for (const result of results) {
  console.log('Image to image masking result filepath:', result.filepath);
}
```

## Generation (v2alpha)

### Image to Video

``` typescript
const result = await stability.v2Alpha.generation.imageToVideo(
  'https://www.example.com/images/photo-you-want-to-move.png'
)

let filepath: string | undefined = undefined

while (!filepath) {
  const videoResult = await stability.v2Alpha.generation.imageToVideoResult(result.id)

  if ("filepath" in videoResult) {
    filepath = videoResult.filepath
  } else if ('status' in videoResult && videoResult.status === 'in-progress') {
    await new Promise(resolve => setTimeout(resolve, 2500))
  }
}

console.log('Image to video result filepath:', filepath)
```

### 4k Upscale

``` typescript
const result = await stability.v2Alpha.generation.upscale(
  'https://www.example.com/images/photo-you-to-4k-upscale.png',
  'UHD 4k'
)

let filepath: string | undefined = undefined

while (!filepath) {
  const upscaleResult = await stability.v2Alpha.generation.upscaleResult(result.id, result.output_format)

  if ("filepath" in upscaleResult) {
    filepath = upscaleResult.filepath
  } else if ('status' in upscaleResult && upscaleResult.status === 'in-progress') {
    await new Promise(resolve => setTimeout(resolve, 2500))
  }
}

console.log('4k Upscale result filepath:', filepath)
```

### Inpaint

```typescript
const result = await stability.v2Alpha.generation.inpaint(
  'https://www.example.com/images/your-image-of-the-earth.png',
  'disco ball',
  {
    mode: 'search',
    search_prompt: 'the earth'
  }
);

console.log('Inpaint result filepath:', result.filepath);
```

## Development and testing

Built in TypeScript, tested with Jest.

```bash
$ yarn install
$ yarn test
```

Road Map

```
- Support local files
- Support output to S3/GCS bucket
- Wrap job/result methods into one async task w/ internal polling
```