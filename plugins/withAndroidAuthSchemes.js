const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Android ORs <data> tags incorrectly when two schemes share one VIEW filter.
 * Google's return to exp+crew-up-app:// then never opens the app, so the login
 * sheet stays up. One filter per scheme.
 */
function withAndroidAuthSchemes(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    const activity = application?.activity?.find((item) => item.$?.['android:name'] === '.MainActivity');
    if (!activity?.['intent-filter']) return config;

    activity['intent-filter'] = activity['intent-filter'].flatMap((filter) => {
      const data = filter.data ? (Array.isArray(filter.data) ? filter.data : [filter.data]) : [];
      const schemes = data.filter((item) => item.$ && Object.keys(item.$).length === 1 && item.$['android:scheme']);
      if (schemes.length < 2) return [filter];
      const rest = data.filter((item) => !schemes.includes(item));
      return schemes.map((scheme) => ({ ...filter, data: [...rest, scheme] }));
    });

    return config;
  });
}

module.exports = withAndroidAuthSchemes;
