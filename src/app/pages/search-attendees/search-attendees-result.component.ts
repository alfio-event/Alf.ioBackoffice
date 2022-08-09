import {Component} from "@angular/core";
import {ModalDialogParams} from "@nativescript/angular";
import {Account, EventConfiguration} from "~/app/shared/account/account";
import {AttendeeSearchResult} from "~/app/shared/scan/scan-common";
import {ScanService} from "~/app/shared/scan/scan.service";

@Component({
    moduleId: module.id,
    selector: "search-attendees-result",
    templateUrl: "./search-attendees-result.html",
    styleUrls: ["./search-attendees-result.scss"]
})
export class SearchAttendeesResultComponent {

    account: Account;
    attendee: AttendeeSearchResult;
    event: EventConfiguration;
    qrCodeUrl: string;

    constructor(private params: ModalDialogParams, private scanService: ScanService) {
        this.account = params.context.account;
        this.attendee = params.context.attendee;
        this.event = params.context.event;
        this.qrCodeUrl = `${this.account.url}/api/v2/public/event/${this.event.key}/ticket/${this.attendee.uuid}/code.png`;
    }

    onBackTap(): void {
        this.params.closeCallback(true);
    }


    checkIn(): void {
        this.scanService.manualCheckIn(this.event.key, this.account, this.attendee.uuid)
            .subscribe(res => console.log('res'));
    }
}