import { SponsorScan, ScanStatus, LeadStatus } from "~/app/shared/scan/sponsor-scan";
import { Component, Input, OnInit } from "@angular/core";
import { Ticket } from "~/app/shared/scan/scan-common";
import {SponsorScanService} from "~/app/shared/scan/sponsor-scan.service";

@Component({
    moduleId: module.id,
    selector: "sponsor-scan-badge",
    templateUrl: "./sponsor-scan-badge.html",
    styleUrls: ["./sponsor-scan-badge.scss"]
})
export class SponsorScanBadgeComponent implements OnInit {

    @Input()
    item: SponsorScan;
    @Input()
    showArrow: boolean = true;
    ticket?: Ticket;


    ngOnInit(): void {
        this.ticket = this.item?.ticket;
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
        } else if (SponsorScanService.isNotTemporary(this.item.ticket)) {
            return this.item.ticket.uuid.slice(0, 8).toUpperCase();
        }
        return "Synchronizing..."
    }

    get commentText(): string {
        return this.item.notes != null && this.item.notes.length > 0 ? String.fromCharCode(0xf260) : "";
    }

    get rowLayout(): string {
        if (this.showArrow) {
            return "36, 5, *, auto, auto, 50, 16";
        }
        return "36, 5, *, 40, 40, 16";
    }

    get statusClass(): string {
        switch (this.item.leadStatus) {
            case LeadStatus.COLD:
                return "text-primary";
            case LeadStatus.WARM:
                return "text-orange";
            case LeadStatus.HOT:
                return "text-danger";
        }
    }

    get leadStatusIcon(): string {
       // &#xf161;
       switch (this.item.leadStatus) {
        case LeadStatus.COLD:
            return String.fromCharCode(0xf163);
        case LeadStatus.WARM:
            return String.fromCharCode(0xf1d6);
        case LeadStatus.HOT:
            return String.fromCharCode(0xf161);
        }
    }

}
