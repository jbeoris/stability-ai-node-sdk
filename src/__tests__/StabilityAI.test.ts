import StabilityAI from '../index';
import dotenv from "dotenv";

dotenv.config();

let stability: StabilityAI | undefined
const makeStability = () => new StabilityAI(process.env.STABILITY_AI_API_KEY || '')

beforeEach(async () => {
  stability = makeStability()
});

afterEach(async () => {
  // do nothing yet
});

// v1/user

test('Get user account - (v1/user/account)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const { email, id, organizations, profile_picture } = await stability.v1.user.account()

  console.log('User email:', email);
  console.log('User id:', id);
  console.log('User organizations:', organizations);
  if (profile_picture) console.log('User profile picture:', profile_picture);

  expect(typeof email).toBe('string');
  expect(typeof id).toBe('string');
  expect(Array.isArray(organizations)).toBe(true);
});

test('Get user balance - (v1/user/balance)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const { credits } = await stability.v1.user.balance()

  console.log('User credits balance:', credits);

  expect(typeof credits).toBe('number');
});

// v1/engines

test('List available engines - (v1/engines/list)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const engines = await stability.v1.engines.list()

  console.log('Engine list:', engines);

  expect(Array.isArray(engines)).toBe(true);
});

// v1/generation

test('Text to image -  (v1/generation/text-to-image)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const results = await stability.v1.generation.textToImage(
    'stable-diffusion-xl-beta-v2-2-2', 
    [
      { text: 'a man on a horse', weight: 0.5 },
      { text: 'a giant koala', weight: 0.5 } 
    ]
  )

  for (const result of results) {
    console.log('Text to image result filepath:', result.filepath);
  }

  expect(Array.isArray(results)).toBe(true);
}, 30000);

test('Image to Image - (v1/generation/image-to-image)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const results = await stability.v1.generation.imageToImage(
    'stable-diffusion-xl-beta-v2-2-2', 
    [
      { text: 'crazy techincolor surprise', weight: 0.5 }
    ],
    'https://upload.wikimedia.org/wikipedia/commons/e/e5/Prick%C3%A4tarpucken.jpg'
  )

  for (const result of results) {
    console.log('Image to image result filepath:', result.filepath);
  }

  expect(Array.isArray(results)).toBe(true);
}, 30000);

test('Image to Image Upscale - (v1/generation/image-to-image/upscale)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const results = await stability.v1.generation.imageToImageUpscale(
    'https://live.staticflickr.com/7151/6760135001_58b1c5c5f0_b.jpg',
    {
      type: 'esrgan'
    }
  )

  for (const result of results) {
    console.log('Image to image upscale result filepath:', result.filepath);
  }

  expect(Array.isArray(results)).toBe(true);
}, 30000);

test('Image to Image Masking - (v1/generation/image-to-image/masking)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const results = await stability.v1.generation.imageToImageMasking(
    'stable-diffusion-xl-beta-v2-2-2', 
    [
      { text: 'a beautiful ocean', weight: 0.5 }
    ],
    'https://upload.wikimedia.org/wikipedia/commons/6/63/Icon_Bird_512x512.png',
    {
      mask_source: 'INIT_IMAGE_ALPHA'
    }
  )

  for (const result of results) {
    console.log('Image to image masking result filepath:', result.filepath);
  }

  expect(Array.isArray(results)).toBe(true);
}, 30000);

// v2alpha/generation

test('Image to Video - (v2alpha/generation/image-to-video)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2Alpha.generation.imageToVideo(
    'https://cdn-uploads.huggingface.co/production/uploads/1669639889631-624d53894778284ac5d47ea2.jpeg'
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

  expect(typeof filepath).toBe('string');
}, 600000);

test('4k Upscale - (v2alpha/generation/upscale)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2Alpha.generation.upscale(
    'https://live.staticflickr.com/7151/6760135001_58b1c5c5f0_b.jpg',
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

  console.log('Upscale result filepath:', filepath)

  expect(typeof filepath).toBe('string');
}, 600000);

test('Inpaint - (v2alpha/generation/inpaint)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2Alpha.generation.inpaint(
    { mode: 'search', search_prompt: 'the earth' },
    'https://live.staticflickr.com/7151/6760135001_58b1c5c5f0_b.jpg',
    'disco ball'
  );

  console.log('Inpaint result filepath:', result.filepath);

  expect(typeof result.filepath).toBe('string');
}, 60000);