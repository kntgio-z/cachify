import CachifyError from "../lib/errors";

/**
 * Validates a duration.
 * @param duration - The expiration time for cache entries in milliseconds.
 * @throws {CachifyError} Throws an error if the duration is invalid.
 */
export const validateDuration = (duration: number) => {
  if (typeof duration !== "number" || duration <= 0) {
    throw new CachifyError(
      "Invalid expiration time. It should be a positive number."
    );
  }
};

/**
 * Validates a cache key.
 * @param key - The cache key.
 * @throws {CachifyError} Throws an error if the key is invalid.
 */
export const validateKey = (key: string) => {
  if (!key || typeof key !== "string") {
    throw new CachifyError("Invalid key. It should be a non-empty string.");
  }
};
