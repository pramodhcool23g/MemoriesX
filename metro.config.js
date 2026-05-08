const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
    resolver: {
        // This makes it possible to import .glb files in your code:
        assetExts: [...defaultConfig.resolver.assetExts, 'glb', 'obj', 'mtl'],
    },
};

module.exports = mergeConfig(defaultConfig, config);
