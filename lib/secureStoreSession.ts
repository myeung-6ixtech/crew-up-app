import * as SecureStore from 'expo-secure-store';
import type { SessionStorageBackend, StoredSession } from '@nhost/nhost-js/session';

const SESSION_KEY = 'nhostSession';

export class SecureStoreSession implements SessionStorageBackend {
  private cache: StoredSession | null = null;
  private loaded = false;
  private loadPromise: Promise<void> | null = null;

  private async ensureLoaded() {
    if (this.loaded) return;
    if (!this.loadPromise) {
      this.loadPromise = SecureStore.getItemAsync(SESSION_KEY).then((raw) => {
        this.cache = raw ? (JSON.parse(raw) as StoredSession) : null;
        this.loaded = true;
      });
    }
    await this.loadPromise;
  }

  get(): StoredSession | null {
    if (!this.loaded && !this.loadPromise) {
      void this.ensureLoaded();
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
    this.loadPromise = null;
    void SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(value));
  }

  remove(): void {
    this.cache = null;
    this.loaded = true;
    this.loadPromise = null;
    void SecureStore.deleteItemAsync(SESSION_KEY);
  }
}

export const secureStoreSession = new SecureStoreSession();
