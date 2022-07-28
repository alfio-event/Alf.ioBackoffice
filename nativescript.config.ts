import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'alfio.scan',
  main: 'src/main.ts',
  appResourcesPath: 'App_Resources',
  webpackConfigPath: 'webpack.config.js',
  ios: {
    discardUncaughtJsExceptions: true,
  },
  android: {
    discardUncaughtJsExceptions: true,
    v8Flags: '--expose_gc',
    markingMode: 'none',
    suppressCallJSMethodExceptions: false,
  },
  appPath: 'src',
} as NativeScriptConfig;
