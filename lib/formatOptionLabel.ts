/** Turn snake_case enum values into readable pill labels. */
export function formatOptionLabel(value: string) {
  return value.replace(/_/g, ' ');
}
