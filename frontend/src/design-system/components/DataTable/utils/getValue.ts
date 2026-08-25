/**
 * Helper to retrieve a nested value from an object using a dot-notation path.
 * E.g., getValue({ user: { profile: { name: "Rahul" } } }, "user.profile.name") -> "Rahul"
 */
export function getValue(obj: any, path?: string): any {
  if (!obj || !path) return undefined;

  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}
