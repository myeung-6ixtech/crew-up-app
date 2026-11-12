const app = require('./app.json');

const STORE_PROFILES = new Set(['preview', 'production', 'testflight']);

/** Store builds must use the production push entitlement. Development crashes TestFlight on launch. */
module.exports = () => {
  const expo = JSON.parse(JSON.stringify(app.expo));
  const mode = STORE_PROFILES.has(process.env.EAS_BUILD_PROFILE) ? 'production' : 'development';

  expo.plugins = expo.plugins.map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'expo-notifications') {
      return [plugin[0], { ...plugin[1], mode }];
    }
    return plugin;
  });

  return { expo };
};
