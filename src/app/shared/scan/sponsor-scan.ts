import { Ticket, CheckInStatus } from './scan-common';

export class SponsorScan {
    constructor(public code: string,
                public status: ScanStatus = ScanStatus.NEW,
                public ticket: Ticket,
                public notes: string,
                public leadStatus: LeadStatus = LeadStatus.WARM) {}
    isPending(): boolean {
        return [ScanStatus.IN_PROCESS, ScanStatus.NEW].some(s => s === this.status);
    }
}

export enum ScanStatus {
    NEW, IN_PROCESS, ERROR, DONE, UPDATED
}

export enum LeadStatus {
    COLD = 'COLD',
    WARM = 'WARM',
    HOT = 'HOT'
}

export function checkInStatusToScanStatus(checkInStatus: CheckInStatus): ScanStatus {
    switch (checkInStatus) {
        case "INVALID_TICKET_STATE":
            // the ticket status has not been uploaded yet, so we will retry.
            return ScanStatus.ERROR;

        case "SUCCESS":
            return ScanStatus.DONE;

        default:
            return ScanStatus.ERROR;
    }
}

export enum ScanResult {
    OK = 'OK',
    DUPLICATE = 'DUPLICATE',
    INVALID = 'INVALID'
}