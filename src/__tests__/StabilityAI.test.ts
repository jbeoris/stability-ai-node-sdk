import StabilityAI from '../index';
import dotenv from 'dotenv';
import path from 'path';
import * as Util from '../util';

dotenv.config();

let stability: StabilityAI | undefined;
const makeStability = () =>
  new StabilityAI(process.env.STABILITY_AI_API_KEY || '');

const LOCAL_TEST_FILES = {
  bird: path.join(__dirname, '..', '..', 'test_data', 'bird.png'),
  earth: path.join(__dirname, '..', '..', 'test_data', 'earth.jpg'),
  pacman: path.join(__dirname, '..', '..', 'test_data', 'pacman.jpg'),
  aztec: path.join(__dirname, '..', '..', 'test_data', 'aztec.jpeg'),
  bear: path.join(__dirname, '..', '..', 'test_data', 'bear.png'),
  test: path.join(__dirname, '..', '..', 'test_data', 'test.png'),
};

const PUBLIC_TEST_URLS = {
  bird: 'https://storage.googleapis.com/storage.catbird.ai/test-data/bird.png',
  earth:
    'https://storage.googleapis.com/storage.catbird.ai/test-data/earth.jpg',
  pacman:
    'https://storage.googleapis.com/storage.catbird.ai/test-data/pacman.jpg',
  aztec:
    'https://storage.googleapis.com/storage.catbird.ai/test-data/aztec.jpeg',
  bear: 'https://storage.googleapis.com/storage.catbird.ai/test-data/bear.png',
  test: 'https://storage.googleapis.com/storage.catbird.ai/test-data/test.png',
};

beforeEach(async () => {
  stability = makeStability();
});

afterEach(async () => {
  // do nothing yet
});

const TEST_URL =
  'https://ik.imagekit.io/newcompute/tr:h-2048,w-2048,c-at_max,q-100,f-jpg/users/9989128762560512/assets/f301bc58-a296-47e0-8560-85fb50a9ef40.jpg';

test('Util.isValidHttpUrl', async () => {
  expect(Util.isValidHttpUrl(TEST_URL)).toBe(true);
  expect(Util.isValidHttpUrl(PUBLIC_TEST_URLS.bird)).toBe(true);
  expect(Util.isValidHttpUrl(LOCAL_TEST_FILES.bird)).toBe(false);
});

test('Util.isValidFile', async () => {
  expect(Util.isValidFile(TEST_URL)).toBe(false);
  expect(Util.isValidFile(PUBLIC_TEST_URLS.bird)).toBe(false);
  expect(Util.isValidFile(LOCAL_TEST_FILES.bird)).toBe(true);
});

// v1/user

test('Get user account - (v1/user/account)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const { email, id, organizations, profile_picture } =
    await stability.v1.user.account();

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

  const { credits } = await stability.v1.user.balance();

  console.log('User credits balance:', credits);

  expect(typeof credits).toBe('number');
});

// v1/engines

test('List available engines - (v1/engines/list)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const engines = await stability.v1.engines.list();

  console.log('Engine list:', engines);

  expect(Array.isArray(engines)).toBe(true);
});

// v1/generation

test('Text to image -  (v1/generation/text-to-image)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const results = await stability.v1.generation.textToImage(
    'stable-diffusion-xl-1024-v1-0',
    [
      { text: 'a man on a horse', weight: 0.5 },
      { text: 'a giant koala', weight: 0.5 },
    ],
  );

  for (const result of results) {
    console.log('Text to image result filepath:', result.filepath);
  }

  expect(Array.isArray(results)).toBe(true);
}, 30000);

test('Image to Image - (v1/generation/image-to-image)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const results = await stability.v1.generation.imageToImage(
    'stable-diffusion-xl-1024-v1-0',
    [{ text: 'crazy techincolor surprise', weight: 0.5 }],
    LOCAL_TEST_FILES.test,
  );

  for (const result of results) {
    console.log('Image to image result filepath:', result.filepath);
  }

  expect(Array.isArray(results)).toBe(true);
}, 30000);

test('Image to Image Masking - (v1/generation/image-to-image/masking)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const results = await stability.v1.generation.imageToImageMasking(
    'stable-diffusion-xl-1024-v1-0',
    [{ text: 'a beautiful ocean', weight: 0.5 }],
    LOCAL_TEST_FILES.test,
    {
      mask_source: 'INIT_IMAGE_ALPHA',
    },
  );

  for (const result of results) {
    console.log('Image to image masking result filepath:', result.filepath);
  }

  expect(Array.isArray(results)).toBe(true);
}, 30000);

// v2beta

test('Stable Image Generate Ultra - (v2beta/stale-image/generate/ultra)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2beta.stableImage.generate.ultra(
    'a beautiful mountain',
  );

  console.log('Stable Image Generate Ultra result filepath:', result.filepath);

  expect(typeof result.filepath).toBe('string');
}, 600000);

test('Stable Image Generate Core - (v2beta/stale-image/generate/core)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result =
    await stability.v2beta.stableImage.generate.core('a beautiful ocean');

  console.log('Stable Image Generate Core result filepath:', result.filepath);

  expect(typeof result.filepath).toBe('string');
}, 600000);

test('Stable Image Generate SD3 - (v2beta/stale-image/generate/sd3)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result =
    await stability.v2beta.stableImage.generate.sd3('a beautiful ocean');

  console.log('Stable Image Generate SD3 result filepath:', result.filepath);

  expect(typeof result.filepath).toBe('string');
}, 600000);

test('Stable 3D Stable Fast 3D - (v2beta/3d/stable-fast-3d)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2beta.stable3D.stableFast3D(
    PUBLIC_TEST_URLS.bear,
  );

  console.log('Stable 3D Stable Fast 3D result filepath:', result.filepath);

  expect(typeof result.filepath).toBe('string');
}, 600000);

test('Stable Video Image to Video - (v2beta/image-to-video)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2beta.stableVideo.imageToVideo(
    LOCAL_TEST_FILES.aztec,
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

  expect(typeof filepath).toBe('string');
}, 600000);

test('Stable Image Upscale Conservative - (v2beta/stable-image/upscale/conservative)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2beta.stableImage.upscale.conservative(
    LOCAL_TEST_FILES.earth,
    'UHD 4k',
  );

  console.log(
    'Stable Image Upscale Conservative result filepath:',
    result.filepath,
  );

  expect(typeof result.filepath).toBe('string');
}, 600000);

test('Stable Image Upscale Creative - (v2beta/stable-image/upscale/creative)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2beta.stableImage.upscale.startCreative(
    LOCAL_TEST_FILES.earth,
    'UHD 4k',
  );

  let filepath: string | undefined = undefined;

  while (!filepath) {
    const upscaleResult =
      await stability.v2beta.stableImage.upscale.fetchCreativeResult(
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

  expect(typeof filepath).toBe('string');
}, 600000);

test('Stable Image Edit Erase - (v2beta/stable-image/edit/erase)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2beta.stableImage.edit.erase(
    LOCAL_TEST_FILES.bird,
  );

  console.log('Stable Image Edit Erase result filepath:', result.filepath);

  expect(typeof result.filepath).toBe('string');
}, 60000);

test('Stable Image Edit Inpaint - (v2beta/stable-image/edit/inpaint)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2beta.stableImage.edit.inpaint(
    LOCAL_TEST_FILES.bird,
    'disco ball',
  );

  console.log('Stable Image Edit Inpaint result filepath:', result.filepath);

  expect(typeof result.filepath).toBe('string');
}, 60000);

test('Stable Image Edit Outpaint - (v2beta/stable-image/edit/outpaint)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2beta.stableImage.edit.outpaint(
    LOCAL_TEST_FILES.bird,
    {
      prompt: 'outer space',
      left: 100,
    },
  );

  console.log('Stable Image Edit Outpaint result filepath:', result.filepath);

  expect(typeof result.filepath).toBe('string');
}, 60000);

test('Stable Image Edit Search and Replace - (v2beta/stable-image/edit/search-and-replace)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2beta.stableImage.edit.searchAndReplace(
    LOCAL_TEST_FILES.earth,
    'a disco ball',
    'the earth',
  );

  console.log(
    'Stable Image Edit Search And Replace result filepath:',
    result.filepath,
  );

  expect(typeof result.filepath).toBe('string');
}, 60000);

test('Stable Image Edit Remove Background - (v2beta/stable-image/edit/remove-background)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2beta.stableImage.edit.removeBackground(
    LOCAL_TEST_FILES.earth,
  );

  console.log(
    'Stable Image Edit Remove Background result filepath:',
    result.filepath,
  );

  expect(typeof result.filepath).toBe('string');
}, 60000);

test('Stable Image Edit Replace Background and Relight - (v2beta/stable-image/edit/replace-background-and-relight)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');
  const result =
    await stability.v2beta.stableImage.edit.replaceBackgroundAndRelight(
      LOCAL_TEST_FILES.bird,
      {
        backgroundPrompt: 'a beautiful sunset',
        foregroundPrompt: 'enhance lighting',
        lightSourceDirection: 'above',
        lightSourceStrength: 0.7,
      },
    );

  let filepath: string | undefined = undefined;

  while (!filepath) {
    const relightResult =
      await stability.v2beta.stableImage.results.fetchAsyncGenerationResult(
        result.id,
      );

    if ('filepath' in relightResult) {
      filepath = relightResult.filepath;
    } else if (
      'status' in relightResult &&
      relightResult.status === 'in-progress'
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
  }

  console.log(
    'Stable Image Edit Replace Background and Relight result filepath:',
    filepath,
  );

  expect(typeof filepath).toBe('string');
}, 60000);

test('Stable Image Control Sketch - (v2beta/stable-image/control/sketch)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2beta.stableImage.control.sketch(
    LOCAL_TEST_FILES.earth,
    'a disco ball',
  );

  console.log('Stable Image Control Sketch filepath:', result.filepath);

  expect(typeof result.filepath).toBe('string');
}, 60000);

test('Stable Image Control Structure - (v2beta/stable-image/control/structure)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2beta.stableImage.control.structure(
    LOCAL_TEST_FILES.earth,
    'a disco ball',
  );

  console.log('Stable Image Control Structure filepath:', result.filepath);

  expect(typeof result.filepath).toBe('string');
}, 60000);

test('Stable Image Control Style - (v2beta/stable-image/control/style)', async () => {
  if (!stability) throw new Error('StabilityAI instance not found');

  const result = await stability.v2beta.stableImage.control.style(
    LOCAL_TEST_FILES.earth,
    'a disco ball',
  );

  console.log('Stable Image Control Style filepath:', result.filepath);

  expect(typeof result.filepath).toBe('string');
}, 60000);
