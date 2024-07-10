import Redis from "ioredis";
import { validateDuration, validateKey } from "../utils/validators";
import { RedisCachifyModule } from "../types/interface";
import { log } from "@tralse/developer-logs";
import CachifyError from "./errors";

export default class CachifyRedis implements RedisCachifyModule {
  redis: Redis;
  private _debug = false;

  /**
   * Creates an instance of CachifyRedis.
   * @param Redis - Redis connection or instance.
   */
  constructor(instance: Redis) {
    this.redis = instance;
  }

  /**
   * Sets a cache entry.
   * @param key - The cache key.
   * @param value - The value to cache.
   * @param duration - The expiration time for cache entries in milliseconds.
   * @throws {CachifyError} Throws an error if the key or duration is invalid.
   */
  async set(key: string, value: any, duration: number) {
    validateKey(key);
    validateDuration(duration);
    await this.redis.set(key, JSON.stringify(value), "EX", duration);
    if (this._debug) log.green(`Set cache for key: ${key}`, "cachify");
  }

  /**
   * Gets a cache entry.
   * @param key - The cache key.
   * @returns The cached value, or null if not found.
   * @throws {CachifyError} Throws an error if the key is invalid.
   */
  async get(key: string) {
    validateKey(key);
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Deletes a cache entry.
   * @param key - The cache key.
   * @throws {CachifyError} Throws an error if the key is invalid.
   */
  async dispose(key: string) {
    validateKey(key);
    await this.redis.del(key);
    if (this._debug) log.yellow(`Disposed cache for key: ${key}`, "cachify");
  }

  /**
   * Deletes cache entries with keys that include the specified prefix.
   * @param prefix - The prefix for keys to delete.
   * @throws {CachifyError} Throws an error if the prefix is invalid.
   */
  async disposePrefix(prefix: string) {
    validateKey(prefix);
    const keys = await this.redis.keys(`${prefix}*`);
    if (keys.length) {
      await this.redis.del(keys);
    }
    if (this._debug)
      log.yellow(`Disposed cache for keys with prefix: ${prefix}`, "cachify");
  }

  /**
   * Caches the result of a callback function if not already cached.
   * @param key - The cache key.
   * @param callback - The function to generate fresh value if not cached.
   * @param duration - The expiration time for cache entries in milliseconds.
   * @returns The cached or fresh value.
   * @throws {CachifyError} Throws an error if the key or callback is invalid.
   */
  async cachify(key: string, callback: Function, duration: number) {
    validateKey(key);
    if (typeof callback !== "function") {
      throw new CachifyError("Invalid callback. It should be a function.");
    }
    const cachedvalue = await this.get(key);
    if (cachedvalue) {
      if (this._debug) log.green(`Cache hit for key: ${key}`, "cachify");
      return cachedvalue;
    }
    try {
      const freshData = await callback();
      await this.set(key, freshData, duration);
      if (this._debug) log.yellow(`Cache miss for key: ${key}`, "cachify");
      return freshData;
    } catch (error) {
      console.error(`Error fetching fresh value for key ${key}:`, error);
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
     * @returns The parsed JSON value, or null if not found.
     * @throws {CachifyError} Throws an error if the key is invalid or the value is not valid JSON.
     */
    get: async (key: string) => {
      const value = await this.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch (error: any) {
        throw new CachifyError(
          `Failed to parse JSON for key ${key}: ${error.message}`
        );
      }
    },

    /**
     * Sets a JSON cache entry.
     * @param key - The cache key.
     * @param value - The value to cache.
     * @param duration - The expiration time for cache entries in milliseconds.
     * @throws {CachifyError} Throws an error if the key is invalid or the value cannot be stringified.
     */
    set: async (key: string, value: Object, duration: number) => {
      try {
        await this.set(key, JSON.stringify(value), duration);
      } catch (error: any) {
        throw new CachifyError(
          `Failed to stringify value for key ${key}: ${error.message}`
        );
      }
    },
  };
}
