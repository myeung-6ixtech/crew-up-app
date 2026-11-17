const fs = require('fs');
const path = require('path');
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
  expo.plugins.push('./plugins/withIosNodeBinary');
  expo.plugins.push('./plugins/withAndroidAuthSchemes');

  // EAS file env during a cloud build, or a gitignored local copy. Never commit the file.
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ||
    (fs.existsSync(path.join(__dirname, 'google-services.json')) ? './google-services.json' : undefined);
  if (googleServicesFile) {
    expo.android.googleServicesFile = googleServicesFile;
  }

  return { expo };
};
