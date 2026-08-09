/** Nhost Storage bucket ids — must match storage.buckets rows in crew-up-nhost migrations. */
export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  rosters: 'rosters',
  verificationDocs: 'verification-docs',
} as const;

export type StorageBucketId = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];
