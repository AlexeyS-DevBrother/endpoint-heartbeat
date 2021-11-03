import { createHash } from 'crypto';
/**
 * Cache decorator
 * @param ttlMs time to live in milliseconds
 */
export function ThruCacheAsync(ttlMs: number) {
  const storage = new Map<string, { expires: Date; value: any }>();
  return (
    target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor,
  ) => {
    const originalMethod = propertyDescriptor.value;
    propertyDescriptor.value = function (...args: any[]) {
      const key = createHash('md5')
        .update(JSON.stringify([propertyKey, args]))
        .digest('hex');
      const storedResult = storage.get(key);
      const now = new Date();
      if (storedResult && storedResult.expires >= now) {
        return Promise.resolve(storedResult.value);
      }
      const result = originalMethod.apply(this, args);
      result.then((data: any) => {
        now.setMilliseconds(now.getMilliseconds() + ttlMs);
        storage.set(key, {
          expires: now,
          value: data,
        });
      });
      return result;
    };
  };
}
