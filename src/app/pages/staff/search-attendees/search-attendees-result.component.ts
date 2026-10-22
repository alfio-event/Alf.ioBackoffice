import {Component} from "@angular/core";
import {ModalDialogParams} from "@nativescript/angular";
import {Account, EventConfiguration} from "~/app/shared/account/account";
import {AttendeeSearchResult} from "~/app/shared/scan/scan-common";

@Component({
    selector: "search-attendees-result",
    templateUrl: "./search-attendees-result.html",
    standalone: false,
})
export class SearchAttendeesResultComponent {

    account: Account;
    attendee: AttendeeSearchResult;
    event: EventConfiguration;

    constructor(private params: ModalDialogParams) {
        this.account = params.context.account;
        this.attendee = params.context.attendee;
        this.event = params.context.event;
    }

    back() {
      this.params.closeCallback(true);
    }
}
