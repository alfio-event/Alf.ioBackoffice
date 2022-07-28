// source https://gist.github.com/vakrilov/522dbd30085142c515a5359658f06e54
import { Directive, ViewContainerRef, TemplateRef, Inject } from '@angular/core';
import { IDevice, platformNames } from "@nativescript/core/platform";
import { DEVICE } from "@nativescript/angular";

@Directive({ selector: "[ifAndroid]" })
export class IfAndroidDirective {
    constructor( @Inject(DEVICE) device: IDevice, container: ViewContainerRef, templateRef: TemplateRef<Object>) {
        if (device.os === platformNames.android) {
            container.createEmbeddedView(templateRef);
        }
    }
}

@Directive({ selector: "[ifIos]" })
export class IfIosDirective {
    constructor( @Inject(DEVICE) device: IDevice, container: ViewContainerRef, templateRef: TemplateRef<Object>) {
        if (device.os === platformNames.ios) {
            container.createEmbeddedView(templateRef);
        }
    }
}