import { nhostUrls } from '@/lib/nhost';

/** Read-only reference for Nhost service base URLs (crew-up-nhost). */
export const apiEndpoints = {
  auth: nhostUrls.auth,
  graphql: nhostUrls.graphql,
  storage: nhostUrls.storage,
  functions: nhostUrls.functions,
  /** App-facing Actions are invoked via GraphQL, not direct HTTP. */
  actions: {
    parseRoster: 'mutation parseRoster',
    submitReport: 'mutation submitReport',
  },
  /** Webhook-only — never call from the mobile app. */
  internalFunctions: ['presence-compute', 'notification-dispatch'],
} as const;
