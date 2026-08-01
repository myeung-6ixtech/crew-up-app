import { CombinedGraphQLErrors } from '@apollo/client/errors';

const DEPLOY_HINT =
  'Deploy the backend: cd crew-up-nhost && cp .env.deploy.example .env.deploy (add Hasura admin secret) && npm run deploy:cloud';

const AUTH_HINT =
  'Sign out and sign in again. If the problem continues, confirm crew-up-nhost is deployed to your Nhost project.';

function graphQLErrorMessage(error: unknown): string | null {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.map((entry) => entry.message).join('; ');
  }
  if (error instanceof Error) {
    return error.message;
  }
  return null;
}

export function isBackendSchemaError(error: unknown): boolean {
  const message = graphQLErrorMessage(error);
  if (!message) return false;
  return (
    message.includes('not found in type') ||
    message.includes('no_queries_available') ||
    message.includes('no mutations exist')
  );
}

export function isUniquenessViolation(error: unknown): boolean {
  const message = graphQLErrorMessage(error);
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes('uniqueness violation') || lower.includes('duplicate key');
}

export function formatApolloError(error: unknown): string {
  const message = graphQLErrorMessage(error);

  if (message) {
    if (message.includes('not found in type') || message.includes('no_queries_available')) {
      return `Backend schema is not deployed (${message}). ${DEPLOY_HINT}`;
    }
    if (message.includes('no mutations exist')) {
      return `Could not save — the server rejected the request (${message}). ${AUTH_HINT}`;
    }
    return message;
  }

  return 'Something went wrong. Please try again.';
}
