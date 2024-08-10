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

All images passed to this library must be in the format of a local filepath or a public URL.

## Table of Contents

### User (v1)
- [Account](#account)
- [Balance](#balance)

### Engines (v1)
- [List](#list)

### Generation (v1)
- [Text to Image](#text-to-image)
- [Image to Image](#image-to-image)
- [Image to Image - Upscale](#image-to-image---upscale)
- [Image to Image - Masking](#image-to-image---masking)

### 3D (v2beta)
- [Stable Fast 3D](#stable-fast-3d)

### Stable Video (v2beta)
- [Image to Video](#image-to-video)

### Stable Image (v2beta)
- [Generate - Ultra](#generate---ultra)
- [Generate - Core](#generate---core)
- [Generate - SD3](#generate---sd3)
- [Upscale - Conservative](#upscale---conservative)
- [Upscale - Creative](#upscale---creative)
- [Edit - Erase](#edit---erase)
- [Edit - Inpaint](#edit---inpaint)
- [Edit - Outpaint](#edit---outpaint)
- [Edit - Search and Replace](#edit---search-and-replace)
- [Edit - Remove Background](#edit---remove-background)
- [Control - Sketch](#control---sketch)
- [Control - Structure](#control---structure)
- [Control - Style](#control---style)

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

## 3D (v2beta)

### Stable Fast 3D

``` typescript
  const result = await stability.v2beta.stable3D.stableFast3D(
    'https://www.example.com/images/photo-you-want-to-move.png'
  );

  console.log('Stable 3D Stable Fast 3D result filepath:', result.filepath);
```

## Stable Video (v2beta)

### Image to Video

``` typescript
const result = await stability.v2beta.stableVideo.imageToVideo(
  'https://www.example.com/images/photo-you-want-to-move.png'
);

let filepath: string | undefined = undefined;

while (!filepath) {
  const videoResult = await stability.v2beta.stableVideo.imageToVideoResult(
    result.id,
  );

  if ('filepath' in videoResult) {
    filepath = videoResult.filepath;
  } else if (
    'status' in videoResult &&
    videoResult.status === 'in-progress'
  ) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
}

console.log('Stable Video Image to Video result filepath:', filepath);
```

## Stable Image (v2beta)

### Generate - Ultra

```typescript
const result = await stability.v2beta.stableImage.generate.ultra('a beautiful mountain');

console.log('Stable Image Generate Ultra result filepath:', result.filepath);
```

### Generate - Core

```typescript
const result = await stability.v2beta.stableImage.generate.core('a beautiful ocean');

console.log('Stable Image Generate Core result filepath:', result.filepath);
```

### Generate - SD3

```typescript
const result = await stability.v2beta.stableImage.generate.sd3('a very beautiful ocean');

console.log('Stable Image Generate SD3 result filepath:', result.filepath);
```

### Upscale - Conservative

``` typescript
const result = await stability.v2beta.stableImage.upscale.conservative(
  'https://www.example.com/images/photo-you-to-4k-upscale.png',
  'UHD 4k',
);

console.log('Stable Image Upscale Conservative result filepath:', result.filepath);
```

### Upscale - Creative

``` typescript
const result = await stability.v2beta.stableImage.upscale.startCreative(
  'https://www.example.com/images/photo-you-to-4k-upscale.png',
  'UHD 4k',
);

let filepath: string | undefined = undefined;

while (!filepath) {
  const upscaleResult = await stability.v2beta.stableImage.upscale.fetchCreativeResult(
    result.id,
    result.outputFormat,
  );

  if ('filepath' in upscaleResult) {
    filepath = upscaleResult.filepath;
  } else if (
    'status' in upscaleResult &&
    upscaleResult.status === 'in-progress'
  ) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
}

console.log('Stable Image Upscale Creative result filepath:', filepath);
```

### Edit - Erase

```typescript
const result = await stability.v2beta.stableImage.edit.erase(
  'https://www.example.com/images/your-image-of-the-earth.png'
);

console.log('Stable Image Edit Erase result filepath:', result.filepath);
```

### Edit - Inpaint

```typescript
const result = await stability.v2beta.stableImage.edit.inpaint(
  'https://www.example.com/images/your-image-of-the-earth.png',
  'disco ball',
);

console.log('Stable Image Edit Inpaint result filepath:', result.filepath);
```

### Edit - Outpaint

```typescript
const result = await stability.v2beta.stableImage.edit.outpaint(
  'https://www.example.com/images/your-image-of-the-earth.png',
  {
    prompt: 'outer space',
    left: 100
  }
);

console.log('Stable Image Edit Outpaint result filepath:', result.filepath);
```

### Edit - Search and Replace

```typescript
const result = await stability.v2beta.stableImage.edit.searchAndReplace(
  'https://www.example.com/images/your-image-of-the-earth.png',
  'a disco ball',
  'the earth'
);

console.log('Stable Image Edit Search And Replace result filepath:', result.filepath);
```

### Edit - Remove Background

```typescript
const result = await stability.v2beta.stableImage.edit.removeBackground(
  'https://www.example.com/images/your-image-of-the-earth.png',
);

console.log('Stable Image Edit Remove Background result filepath:', result.filepath);
```

### Control - Sketch

```typescript
const result = await stability.v2beta.stableImage.control.sketch(
  'https://www.example.com/images/your-image-of-the-earth.png',
  'a disco ball'
);

console.log('Stable Image Control Sketch result filepath:', result.filepath);
```

### Control - Structure

```typescript
const result = await stability.v2beta.stableImage.control.structure(
  'https://www.example.com/images/your-image-of-the-earth.png',
  'a disco ball'
);

console.log('Stable Image Control Structure result filepath:', result.filepath);
```

### Control - Style

```typescript
const result = await stability.v2beta.stableImage.control.style(
  'https://www.example.com/images/your-image-of-the-earth.png',
  'a disco ball'
);

console.log('Stable Image Control Style result filepath:', result.filepath);
```

## Development and testing

Built in TypeScript, tested with Jest.

```bash
$ yarn install
$ yarn test
```

Road Map

```
- Add input validation for filetypes, dimensions, etc (Zod integration as candidate for this).
- Support output to S3/GCS bucket
- Wrap job/result methods into one async task w/ internal polling
```