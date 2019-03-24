import { Injectable, Inject } from "@angular/core";
import { Feedback } from "nativescript-feedback";
import { android as androidApplication } from "tns-core-modules/application";

@Injectable()
export class FeedbackService {

    private feedback: Feedback;

    constructor() {
        this.feedback = new Feedback();
    }

    public success(message: string): void {
        this.fallbackIfAndroid(message, () => this.feedback.success({
            message: message,
            duration: 2000,
            messageSize: 14
        }));
    }

    public error(message: string): void {
        this.fallbackIfAndroid(message, () => this.feedback.error({
            message: message,
            duration: 2500,
            messageSize: 14
        }));
    }

    public warning(message: string): void {
        this.fallbackIfAndroid(message, () => this.feedback.warning({
            message: message,
            duration: 2000,
            messageSize: 14
        }));
    }

    private fallbackIfAndroid(message: string, fn: () => Promise<void>): Promise<void> {
        if(androidApplication) {
            // at the moment we use ZXing full screen, and apparently we cannot overlay something on top of it.
            // we'll fallback to a simple "toast" for now
            // source: https://github.com/TobiasHennig/nativescript-toast/blob/master/src/toast.android.js
            let centeredText = new android.text.SpannableString(message);
            centeredText.setSpan(new android.text.style.AlignmentSpan.Standard(android.text.Layout.Alignment.ALIGN_CENTER), 0, message.length - 1, android.text.Spannable.SPAN_INCLUSIVE_INCLUSIVE);
            android.widget.Toast.makeText(androidApplication.context, centeredText.toString(), android.widget.Toast.LENGTH_SHORT).show();
            return Promise.resolve();
        } else {
            return fn();
        }
    }
}