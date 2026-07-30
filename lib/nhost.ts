import {
  createClient,
  generateServiceUrl,
  withClientSideSessionMiddleware,
} from '@nhost/nhost-js';
import { secureStoreSession } from './secureStoreSession';

const subdomain = process.env.EXPO_PUBLIC_NHOST_SUBDOMAIN ?? 'local';
const region = process.env.EXPO_PUBLIC_NHOST_REGION ?? 'local';

export const nhost = createClient({
  subdomain,
  region,
  authUrl: process.env.EXPO_PUBLIC_NHOST_AUTH_URL,
  graphqlUrl: process.env.EXPO_PUBLIC_NHOST_GRAPHQL_URL,
  storageUrl: process.env.EXPO_PUBLIC_NHOST_STORAGE_URL,
  functionsUrl: process.env.EXPO_PUBLIC_NHOST_FUNCTIONS_URL,
  storage: secureStoreSession,
  configure: [withClientSideSessionMiddleware],
});

export const nhostUrls = {
  auth: process.env.EXPO_PUBLIC_NHOST_AUTH_URL ?? generateServiceUrl('auth', subdomain, region),
  graphql:
    process.env.EXPO_PUBLIC_NHOST_GRAPHQL_URL ?? generateServiceUrl('graphql', subdomain, region),
  storage:
    process.env.EXPO_PUBLIC_NHOST_STORAGE_URL ?? generateServiceUrl('storage', subdomain, region),
  functions:
    process.env.EXPO_PUBLIC_NHOST_FUNCTIONS_URL ??
    generateServiceUrl('functions', subdomain, region),
};
