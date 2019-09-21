import { SponsorScan, ScanStatus } from "~/app/shared/scan/sponsor-scan";
import { Component, Input, OnInit } from "@angular/core";
import { Ticket } from "~/app/shared/scan/scan-common";

@Component({
    moduleId: module.id,
    selector: "sponsor-scan-badge",
    templateUrl: "./sponsor-scan-badge.html",
    styleUrls: ["./sponsor-scan-badge.css"]
})
export class SponsorScanBadgeComponent implements OnInit {

    @Input()
    item: SponsorScan;
    @Input()
    showArrow: boolean = true;
    ticket: Ticket;


    ngOnInit(): void {
        this.ticket = this.item.ticket;
    }

    get iconForItem(): string {
        switch (this.item.status) {
            case ScanStatus.DONE:
                return String.fromCharCode(0xf26b);
            case ScanStatus.ERROR:
                return String.fromCharCode(0xf1f0);
            default:
                return String.fromCharCode(0xf30c);
        }
    }

    get errorStatus(): boolean {
        return this.item.status === ScanStatus.ERROR;
    }

    get successStatus(): boolean {
        return this.item.status === ScanStatus.DONE;
    }

    get ticketFullName(): string {
        if (this.item.ticket == null) {
            return "Synchronizing...";
        }
        return this.item.ticket.fullName;
    }

    get ticketUuid(): string {
        if (this.item.ticket == null) {
            return this.item.code;
        }
        return this.item.ticket.uuid;
    }

    get commentText(): string {
        return this.item.notes != null && this.item.notes.length > 0 ? String.fromCharCode(0xf260) : "";
    }

}