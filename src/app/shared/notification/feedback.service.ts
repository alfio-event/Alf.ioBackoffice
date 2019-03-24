import { Injectable } from "@angular/core";
import { Feedback } from "nativescript-feedback";

@Injectable()
export class FeedbackService {

    private feedback: Feedback;

    constructor() {
        this.feedback = new Feedback();
    }

    public success(message: string): void {
        this.feedback.success({
            message: message,
            duration: 2000,
            messageSize: 14
        });
    }

    public error(message: string): void {
        this.feedback.error({
            message: message,
            duration: 2500,
            messageSize: 14
        });
    }

    public warning(message: string): void {
        this.feedback.warning({
            message: message,
            duration: 2000,
            messageSize: 14
        });
    }
}