import { Cache, CacheClass } from "memory-cache";
import { validateKey, validateDuration } from "../utils/validators";
import { LocalCachifyModule } from "../types/interface";
import { log } from "@tralse/developer-logs";
import CachifyError from "./errors";

export default class CachifyLocal implements LocalCachifyModule {
  _debug = false;
  cache: CacheClass<string, any>;

  /**
   * Creates an instance of CachifyLocal.
   */
  constructor() {
    this.cache = new Cache();
  }

  /**
   * Sets a cache entry.
   * @param key - The cache key.
   * @param data - The data to cache.
   * @param duration - The expiration time for cache entries in milliseconds.
   * @throws {CachifyError} Throws an error if the key or duration is invalid.
   */
  set(key: string, value: any, duration: number) {
    validateKey(key);
    validateDuration(duration);
    this.cache.put(key, value, duration);
    if (this._debug) log.green(`Set cache for key: ${key}`, "cachify");
  }

  /**
   * Gets a cache entry.
   * @param key - The cache key.
   * @returns The cached data, or null if not found.
   * @throws {CachifyError} Throws an error if the key is invalid.
   */
  get(key: string) {
    validateKey(key);
    return this.cache.get(key);
  }

  /**
   * Deletes a cache entry.
   * @param key - The cache key.
   * @throws {CachifyError} Throws an error if the key is invalid.
   */
  dispose(key: string) {
    validateKey(key);
    this.cache.del(key);
    if (this._debug) log.yellow(`Disposed cache for key: ${key}`, "cachify");
  }

  /**
   * Deletes cache entries with keys that include the specified prefix.
   * @param prefix - The prefix for keys to delete.
   * @throws {CachifyError} Throws an error if the prefix is invalid.
   */
  disposePrefix(prefix: string) {
    validateKey(prefix);
    const keysToDelete = this.cache.keys().filter((k) => k.startsWith(prefix));
    keysToDelete.forEach((key) => this.cache.del(key));
    if (this._debug)
      log.yellow(`Disposed cache for keys with prefix: ${prefix}`, "cachify");
  }

  /**
   * Caches the result of a callback function if not already cached.
   * @param key - The cache key.
   * @param callback - The function to generate fresh data if not cached.
   * @param duration - The expiration time for cache entries in milliseconds.
   * @returns The cached or fresh data.
   * @throws {CachifyError} Throws an error if the key or callback or duration is invalid.
   */
  async cachify(key: string, callback: Function, duration: number) {
    validateKey(key);
    validateDuration(duration);
    if (typeof callback !== "function") {
      throw new CachifyError("Invalid callback. It should be a function.");
    }
    const cachedData = this.get(key);
    if (cachedData) {
      if (this._debug) log.green(`Cache hit for key: ${key}`, "cachify");
      return cachedData;
    }
    try {
      const freshData = await callback();
      this.set(key, freshData, duration);
      if (this._debug) log.yellow(`Cache miss for key: ${key}`, "cachify");
      return freshData;
    } catch (error) {
      console.error(`Error fetching fresh data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Sets the debug mode.
   * @param flag - The debug flag.
   * @throws {CachifyError} Throws an error if the flag is not a boolean.
   */
  setDebug(flag: boolean) {
    if (typeof flag !== "boolean") {
      throw new CachifyError("Invalid flag. It should be a boolean.");
    }
    this._debug = flag;
  }

  /**
   * JSON cache handling methods.
   */
  json = {
    /**
     * Gets a JSON cache entry.
     * @param key - The cache key.
     * @returns The parsed JSON data, or null if not found.
     * @throws {CachifyError} Throws an error if the key is invalid or the data is not valid JSON.
     */
    get: (key: string) => {
      const data = this.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data);
      } catch (error: any) {
        throw new CachifyError(
          `Failed to parse JSON for key ${key}: ${error.message}`
        );
      }
    },

    /**
     * Sets a JSON cache entry.
     * @param key - The cache key.
     * @param value - The data to cache.
     * @param duration - The expiration time for cache entries in milliseconds.
     * @throws {CachifyError} Throws an error if the key is invalid or the value cannot be stringified.
     */
    set: (key: string, value: Object, duration: number) => {
      try {
        this.set(key, JSON.stringify(value), duration);
      } catch (error: any) {
        throw new CachifyError(
          `Failed to stringify value for key ${key}: ${error.message}`
        );
      }
    },
  };
}
