import { platformNativeScript, provideNativeScriptNgZone, runNativeScriptAngularApp } from "@nativescript/angular";

import { AppModule } from "./app/app.module";

// Since Angular 21, bootstrapModule defaults to zoneless change detection.
// The app relies on zone.js to refresh the UI after async work (HTTP, barcode scanner, timers),
// so we explicitly opt back in to zone-based change detection.
runNativeScriptAngularApp({
    appModuleBootstrap: () => platformNativeScript().bootstrapModule(AppModule, {
        applicationProviders: [provideNativeScriptNgZone()]
    })
});
