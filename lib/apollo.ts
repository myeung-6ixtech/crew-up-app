import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  split,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient as createWsClient } from 'graphql-ws';
import { ensureAccessToken } from './sessionAuth';
import { nhostUrls } from './nhost';

function wsUrlFromHttp(httpUrl: string): string {
  return httpUrl.replace(/^http/, 'ws');
}

export function createApolloClient() {
  const httpLink = new HttpLink({ uri: nhostUrls.graphql });

  const authLink = setContext(async (_, prev) => {
    const token = await ensureAccessToken();
    return {
      headers: {
        ...(prev.headers as Record<string, string>),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  const wsLink = new GraphQLWsLink(
    createWsClient({
      url: wsUrlFromHttp(nhostUrls.graphql),
      connectionParams: async () => {
        const token = await ensureAccessToken();
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      },
    }),
  );

  const link = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
      );
    },
    wsLink,
    ApolloLink.from([authLink, httpLink]),
  );

  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
    },
  });
}

export const apolloClient = createApolloClient();
