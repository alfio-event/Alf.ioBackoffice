import { platformNativeScriptDynamic } from "nativescript-angular/platform";

import { AppModule } from "./app.module";
import {forcePortraitOrientation} from "./utils/orientation-util"
import { registerElement } from "nativescript-angular/element-registry";

registerElement("Fab", () => require("nativescript-floatingactionbutton").Fab);
registerElement("CardView", () => require("nativescript-cardview").CardView);

forcePortraitOrientation();

platformNativeScriptDynamic().bootstrapModule(AppModule);