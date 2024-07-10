import { config } from "dotenv";
import { Redis } from "ioredis";

import CachifyError from "./lib/errors";
import CachifyLocal from "./lib/local";
import CachifyRedis from "./lib/redis";

config();

export default class Cachify {
  private _mode: string | undefined;
  private _redisConnection: Redis;
  private _instance: CachifyLocal | CachifyRedis;
  /**
   * Creates new instance of Cachify.
   * This instance is preety useful in developing a cache switch between local caching and redis, between production and development.
   * @param redisConnection
   */
  constructor(redisConnection: Redis) {
    this._mode = process.env.NODE_ENV;
    this._redisConnection = redisConnection; // Initialize redisConnection
    this._instance = this.createInstance(); // Initialize instance based on mode
  }

  /**
   * Creates the appropriate caching instance based on the environment mode.
   * @returns The caching instance.
   */
  createInstance() {
    switch (this._mode) {
      case "development":
        return new CachifyLocal();
      case "production":
        if (!this._redisConnection) {
          throw new CachifyError(
            "Redis connection object is required in production mode."
          );
        }
        return new CachifyRedis(this._redisConnection);
      default:
        throw new CachifyError(`Unknown environment mode: ${this._mode}`);
    }
  }

  /**
   * Gets the current caching instance.
   * @returns The caching instance.
   */
  get instance() {
    return this._instance;
  }

  /**
   * Sets the environment mode and updates the caching instance.
   * @param value - The new environment mode.
   */
  set mode(value: string) {
    if (value !== this._mode) {
      this._mode = value;
      this._instance = this.createInstance();
    }
  }

  /**
   * Static property for accessing the local caching instance directly.
   * Useful for testing or accessing statically.
   * @returns The local caching instance.
   */
  static local = () => new CachifyLocal();

  /**
   * Static method for creating a Redis caching instance directly.
   * Useful for testing or accessing statically.
   * @param connection - The Redis connection object.
   * @returns The Redis caching instance.
   */
  static redis = (connection: Redis) => new CachifyRedis(connection);
}

export { CachifyLocal, CachifyRedis, CachifyError };
