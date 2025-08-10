import {isDevMode} from "@angular/core";
import {Device, Utils} from "@nativescript/core";

export function logIfDevMode(...data: any[]): void {
  if (isDevMode()) {
    console.log(...data);
  }
}

export function appBarClassName(): string {
    if (Device.os !== 'Android') {
        return '';
    }
    const android = Utils.android;
    if (android != null) {
        const resourceId = android.getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (resourceId > 0) {
            const statusBarHeight = android.getResources().getDimensionPixelSize(resourceId);
            if (Utils.layout.toDeviceIndependentPixels(statusBarHeight) > 24) {
                return 'edge-to-edge';
            }
        }
    }
    return '';
}
