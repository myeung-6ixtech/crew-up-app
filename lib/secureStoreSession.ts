import * as SecureStore from 'expo-secure-store';
import type { SessionStorageBackend, StoredSession } from '@nhost/nhost-js/session';

const SESSION_KEY = 'nhostSession';

export class SecureStoreSession implements SessionStorageBackend {
  private cache: StoredSession | null = null;
  private loaded = false;

  private async ensureLoaded() {
    if (this.loaded) return;
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    this.cache = raw ? (JSON.parse(raw) as StoredSession) : null;
    this.loaded = true;
  }

  get(): StoredSession | null {
    if (!this.loaded) {
      SecureStore.getItemAsync(SESSION_KEY).then((raw) => {
        this.cache = raw ? (JSON.parse(raw) as StoredSession) : null;
        this.loaded = true;
      });
    }
    return this.cache;
  }

  async getAsync(): Promise<StoredSession | null> {
    await this.ensureLoaded();
    return this.cache;
  }

  set(value: StoredSession): void {
    this.cache = value;
    this.loaded = true;
    void SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(value));
  }

  remove(): void {
    this.cache = null;
    this.loaded = true;
    void SecureStore.deleteItemAsync(SESSION_KEY);
  }
}

export const secureStoreSession = new SecureStoreSession();
