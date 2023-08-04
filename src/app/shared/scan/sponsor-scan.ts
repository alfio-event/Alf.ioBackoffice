import {CheckInStatus, Ticket} from './scan-common';
import {Account, AccountType} from "~/app/shared/account/account";
import {StorageService} from "~/app/shared/storage/storage.service";

const PENDING_SCANS_TO_PROCESS_KEY = "Alfio_Pending_Scans";

export function pendingScanKeyForAccount(accountKey: string): string {
  return `${PENDING_SCANS_TO_PROCESS_KEY}__${accountKey}`;
}

export class SponsorScan {
    constructor(public code: string,
                public status: ScanStatus = ScanStatus.NEW,
                public ticket: Ticket,
                public notes: string,
                public leadStatus: LeadStatus = LeadStatus.WARM,
                public timestamp = new Date().getTime()) {}
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

export interface LabelLayout {
  qrCode?: QRCode;
  content?: Content;
  general?: General;
  mediaName?: string;
}

export interface QRCode {
  additionalInfo?: Array<string>;
  infoSeparator?: string;
}

export interface Content {
  firstRow?: string;
  secondRow?: string;
  additionalRows: Array<string>;
  checkbox?: boolean;
}
export interface General {
  printPartialID?: boolean;
}

export function getPendingEventDataForSponsor(account: Account, storageService: StorageService): Array<string> {
  console.log("account pending data...");
  try {
    if (account.accountType === AccountType.SPONSOR) {
      const pendingEvents = storageService.getOrDefault(pendingScanKeyForAccount(account.getKey()), "[]");
      return JSON.parse(pendingEvents);
    }
  } catch (e) {
    console.error("got error while trying to deserialize pending event data", e);
  }
  return [];
}
