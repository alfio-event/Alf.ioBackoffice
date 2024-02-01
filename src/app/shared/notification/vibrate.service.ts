import { Injectable } from "@angular/core";
import { Vibrate } from "nativescript-vibrate";
import { Application } from "@nativescript/core/application";
import { TapticEngine, TapticEngineNotificationType } from "nativescript-taptic-engine";

@Injectable()
export class VibrateService {
    private vibrateAndroid: Vibrate;
    private tapticEngine: TapticEngine; // this will work on iPhone 7+

    constructor() {
        if (Application.android) {
            this.vibrateAndroid = new Vibrate();
        } else {
            this.tapticEngine = new TapticEngine();
        }
    }

    public success(): void {
        try {
            if (Application.android) {
                this.vibrateAndroid.vibrate(250);
            } else {
                this.tapticEngine.notification({
                    type: TapticEngineNotificationType.SUCCESS
                });
            }
        } catch (e) {
            console.error("vibrate success: got error", e);
        }
    }

    public error(): void {
        try {
            if (Application.android) {
                this.vibrateAndroid.vibrate([50, 50, 50]);
            } else {
                this.tapticEngine.notification({
                    type: TapticEngineNotificationType.ERROR
                });
            }
        } catch (e) {
            console.error("vibrate failed: got error", e);
        }
    }

    public warning(): void {
        try {
            if (Application.android) {
                this.vibrateAndroid.vibrate([50, 50]);
            } else {
                this.tapticEngine.notification({
                    type: TapticEngineNotificationType.WARNING
                });
            }
        } catch (e) {
            console.error("vibrate warning: got error", e);
        }
    }

    public selection(): void {
        if (Application.android) {
            this.vibrateAndroid.vibrate(50);
        } else {
            this.tapticEngine.selection();
        }
    }
}
