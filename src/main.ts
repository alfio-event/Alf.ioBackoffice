import { platformNativeScript, runNativeScriptAngularApp } from "@nativescript/angular";

import { AppModule } from "./app/app.module";
import {CoreTypes, TouchManager} from "@nativescript/core";

TouchManager.enableGlobalTapAnimations = true
TouchManager.animations = {
  down: {
    scale: { x: 0.90, y: 0.90 },
    duration: 100,
    curve: CoreTypes.AnimationCurve.easeIn
  },
  up: {
    scale: { x: 1, y: 1 },
    duration: 100,
    curve: CoreTypes.AnimationCurve.easeIn
  }
}

runNativeScriptAngularApp({
    appModuleBootstrap: () => platformNativeScript().bootstrapModule(AppModule)
});
