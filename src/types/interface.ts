import { CacheClass } from "memory-cache";
import Redis from "ioredis";

export interface CachifyModule {
  set(key: string, value: any, duration: number): void;
  get(key: string): any;
  dispose(key: string): void;
  disposePrefix(prefix: string): void;
  cachify(
    key: string,
    callback: () => Promise<any>,
    duration: number
  ): Promise<any>;
  setDebug(flag: boolean): void;
  json: {
    get(key: string): object;
    set(key: string, value: object, duration: number): void;
  };
}

export interface LocalCachifyModule extends CachifyModule {
  cache: CacheClass<string, any>;
}

export interface RedisCachifyModule extends CachifyModule {
  redis: Redis;
  set(key: string, value: any, duration: number): Promise<void>;
  get(key: string): Promise<any>;
  dispose(key: string): Promise<void>;
  disposePrefix(prefix: string): Promise<void>;
  cachify(
    key: string,
    callback: () => Promise<any>,
    duration: number
  ): Promise<any>;
  json: {
    get(key: string): Promise<object>;
    set(key: string, value: object, duration: number): Promise<void>;
  };
}
