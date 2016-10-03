import { platformNativeScriptDynamic } from "nativescript-angular/platform";

import { AppModule } from "./app.module";
import { setStatusBarColors } from "./utils/status-bar-util";
import {forcePortraitOrientation} from "./utils/orientation-util"

setStatusBarColors();
forcePortraitOrientation();

platformNativeScriptDynamic().bootstrapModule(AppModule);