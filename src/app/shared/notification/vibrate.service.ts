import { Injectable } from "@angular/core";
import { Vibrate } from "nativescript-vibrate";
import { android } from "@nativescript/core/application";
import { TapticEngine, TapticEngineNotificationType } from "nativescript-taptic-engine";

@Injectable()
export class VibrateService {
    private vibrateAndroid: Vibrate;
    private tapticEngine: TapticEngine; // this will work on iPhone 7+

    constructor() {
        if (android) {
            this.vibrateAndroid = new Vibrate();
        } else {
            this.tapticEngine = new TapticEngine();
        }
    }

    public success(): void {
        if (android) {
            this.vibrateAndroid.vibrate(250);
        } else {
            this.tapticEngine.notification({
                type: TapticEngineNotificationType.SUCCESS
            });
        }
    }

    public error(): void {
        if (android) {
            this.vibrateAndroid.vibrate([50, 50, 50]);
        } else {
            this.tapticEngine.notification({
                type: TapticEngineNotificationType.ERROR
            });
        }
    }

    public warning(): void {
        if (android) {
            this.vibrateAndroid.vibrate([50, 50]);
        } else {
            this.tapticEngine.notification({
                type: TapticEngineNotificationType.WARNING
            });
        }
    }

    public selection(): void {
        if (android) {
            this.vibrateAndroid.vibrate(50);
        } else {
            this.tapticEngine.selection();
        }
    }
}