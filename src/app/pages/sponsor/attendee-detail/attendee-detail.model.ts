import { SponsorScan, LeadStatus } from "~/app/shared/scan/sponsor-scan";

export class SponsorScanViewModel {

    constructor(private scan: SponsorScan) {
    }

    get leadStatus(): LeadStatus {
        return this.scan.leadStatus;
    }

    set leadStatus(leadStatus: LeadStatus) {
        this.scan.leadStatus = leadStatus;
    }

    get notes(): string {
        return this.scan.notes;
    }

    set notes(notes: string) {
        this.scan.notes = notes;
    }
}

/*
public code: string,
                public status: ScanStatus = ScanStatus.NEW,
                public ticket: Ticket,
*/

export const sponsorScanMetadata = {
    isReadOnly: false,
    commitMode: "Immediate",
    validationMode: "Immediate",
    propertyAnnotations: [
        {
            name: "code",
            ignore: true
        },
        {
            name: "status",
            ignore: true
        },
        {
            name: "ticket",
            ignore: true
        },
        {
            name: "leadStatus",
            displayName: "Lead Status",
            editor: "Picker",
            index: 0
        },
        {
            name: "notes",
            displayName: "Comments",
            editor: "MultilineText",
            index: 1
        }
    ]
};
