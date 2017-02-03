import { EventConfiguration } from '../account/account';
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

export class Ticket {
    constructor(public id: number,
                public uuid: string,
                public status: string,
                public firstName: string,
                public lastName: string,
                public email: string) {}
}