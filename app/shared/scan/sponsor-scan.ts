import { EventConfiguration } from '../account/account';
import { Ticket } from './scan-common';

export class SponsorScan {
    constructor(public code: string,
                public status: ScanStatus = ScanStatus.NEW,
                public ticket: Ticket) {}
    isPending(): boolean {
        return [ScanStatus.IN_PROCESS, ScanStatus.NEW].some(s => s == this.status);
    }
}

export enum ScanStatus {
    NEW, IN_PROCESS, ERROR, DONE
}