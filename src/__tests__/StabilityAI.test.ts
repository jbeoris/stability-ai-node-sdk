import StabilityAI from '../index';
import dotenv from "dotenv";

dotenv.config();

let defaultStability: StabilityAI | undefined
const makeDefaultStability = () => new StabilityAI(process.env.STABILITY_AI_API_KEY || '')

beforeEach(async () => {
  defaultStability = makeDefaultStability()
});

afterEach(async () => {
  // do nothing yet
});

test('Check user balance', async () => {
  const balance = await new StabilityAI(process.env.STABILITY_AI_API_KEY || '').v1.user.balance()

  console.log('User balance:', balance);

  expect(typeof balance).toBe('number');
});

test('Run inpaint job', async () => {
  const result = await defaultStability?.v2.generation.inpaint({
    modeOptions: { mode: 'search', search_prompt: 'the earth' },
    image: 'https://live.staticflickr.com/7151/6760135001_58b1c5c5f0_b.jpg',
    prompt: 'disco ball'
  });

  console.log('Inpaint result filepath:', result?.filepath);

  expect(typeof result?.filepath).toBe('string');
}, 60000);

test('Run image-to-video job', async () => {
  const result = await defaultStability?.v2.generation.imageToVideo({
    image: 'https://cdn-uploads.huggingface.co/production/uploads/1669639889631-624d53894778284ac5d47ea2.jpeg'
  })

  if (typeof result?.id !== 'string') throw new Error('Invalid result id')

  let filepath: string | undefined = undefined

  while (!filepath) {
    const videoResult = await defaultStability?.v2.generation.imageToVideoResult({id: result.id})
    if (videoResult && "filepath" in videoResult) {
      filepath = videoResult.filepath
    }
  }

  console.log('Image-to-video result filepath:', filepath)

  expect(typeof filepath).toBe('string');
}, 600000);

test('Run upscale job', async () => {
  const result = await defaultStability?.v2.generation.upscale({
    image: 'https://live.staticflickr.com/7151/6760135001_58b1c5c5f0_b.jpg',
    prompt: 'UHD 4k'
  })

  if (typeof result?.id !== 'string') throw new Error('Invalid result id')

  let filepath: string | undefined = undefined

  while (!filepath) {
    const upscaleResult = await defaultStability?.v2.generation.upscaleResult({id: result.id, output_format: result.output_format})
    if (upscaleResult && "filepath" in upscaleResult) {
      filepath = upscaleResult.filepath
    }
  }

  console.log('Upscale result filepath', filepath)

  expect(typeof filepath).toBe('string');
}, 600000);