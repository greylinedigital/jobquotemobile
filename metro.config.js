const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add TypeScript extensions to source extensions
config.resolver.sourceExts.push('ts', 'tsx');

// Configure transformer to handle TypeScript files in node_modules
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Ensure expo-modules-core and other packages are transformed
config.transformer.transformIgnorePatterns = [
  'node_modules/(?!((react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|expo-modules-core|@supabase/.*|resend))',
];

module.exports = config;