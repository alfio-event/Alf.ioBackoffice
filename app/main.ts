import { platformNativeScriptDynamic } from "nativescript-angular/platform";

import { AppModule } from "./app.module";
import { setStatusBarColors } from "./utils/status-bar-util";
import {forcePortraitOrientation} from "./utils/orientation-util"
import { registerElement } from "nativescript-angular/element-registry";

registerElement("Fab", () => require("nativescript-floatingactionbutton").Fab);
registerElement("CardView", () => require("nativescript-cardview").CardView);

setStatusBarColors();
forcePortraitOrientation();

platformNativeScriptDynamic().bootstrapModule(AppModule);