/**
 * Shared sources use extensionless relative imports (Metro + bundler resolution).
 * Under `--experimental-strip-types`, retry those specifiers against the `.ts` source.
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch (error) {
      if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    }
  }
  return nextResolve(specifier, context);
}
