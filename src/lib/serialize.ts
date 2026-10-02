/**
 * Helper to ensure Server Action responses are 100% plain JSON objects.
 * Converts BSON ObjectIds to strings and dates to ISO strings,
 * preventing React Server Action serialization failures in Next.js production builds.
 */
export function serialize<T>(data: T): T {
  if (data === undefined || data === null) {
    return data;
  }
  return JSON.parse(JSON.stringify(data));
}
