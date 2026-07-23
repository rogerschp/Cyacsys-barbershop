import { registerAs } from '@nestjs/config';

export type MediaEnv = 'dev' | 'prod';

export type MediaConfig = {
  /** Logical root folder in Cloudinary (same account, separated trees). */
  env: MediaEnv;
  storageProvider: string;
};

function resolveMediaEnv(raw: string | undefined): MediaEnv {
  const normalized = (raw ?? 'dev').trim().toLowerCase();
  if (normalized === 'prod' || normalized === 'production') {
    return 'prod';
  }
  return 'dev';
}

export default registerAs(
  'media',
  (): MediaConfig => ({
    env: resolveMediaEnv(process.env.MEDIA_ENV),
    storageProvider: (
      process.env.STORAGE_PROVIDER ?? 'cloudinary'
    ).toLowerCase(),
  }),
);
