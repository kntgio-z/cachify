/**
 * Custom error class for Cachify module.
 */
export default class CachifyError extends Error {
  /**
   * Creates an instance of CachifyError.
   * @param message - The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = "CachifyError";
  }
}
