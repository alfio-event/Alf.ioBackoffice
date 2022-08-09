import { Component, OnInit } from "@angular/core";
import { ModalDialogParams } from "@nativescript/angular";
import { Account } from "~/app/shared/account/account";
import { AttendeeSearchResult } from "~/app/shared/scan/scan-common";
import { ScanService } from "~/app/shared/scan/scan.service";

@Component({
    moduleId: module.id,
    selector: "search-attendees-result",
    templateUrl: "./search-attendees-result.html"
})
export class SearchAttendeesResultComponent {

    account: Account;
    attendee: AttendeeSearchResult;

    constructor(private params: ModalDialogParams,
                private scanService: ScanService) {
                    this.account = params.context.account;
                    this.attendee = params.context.attendee;
                    console.log('constructor called. Account', params.context);
                }

    onBackTap() {
        this.params.closeCallback(true);
    }

}