export class Ticket {
    constructor(public id: number,
                public uuid: string,
                public status: string,
                public firstName: string,
                public lastName: string,
                public fullName: string,
                public categoryName: string) {}
}

export class AdditionalServiceInfo {
    constructor(public name: string,
                public count: Number,
                public fields: Array<TicketFieldValueForAdditionalService>) {}
}

export class TicketFieldValueForAdditionalService {
    constructor(public fieldName: string,
                public fieldValue: string,
                public additionalServiceId: Number) {}
}

export class TicketAndCheckInResult {
    constructor(public ticket: Ticket,
                public result: CheckInResult,
                public additionalServices?: Array<AdditionalServiceInfo>,
                public boxColor?: string) {}
}

export class UnexpectedError extends TicketAndCheckInResult {
    constructor(error: any) {
        let checkInResult = new CheckInResult(CheckInStatus.ERROR, `${error}`);
        super(null, checkInResult);
    }
}

export class InvalidQrCode extends TicketAndCheckInResult {
    constructor(error: any) {
        let checkInResult = new CheckInResult(CheckInStatus.INVALID_TICKET_CODE, `${error}`);
        super(null, checkInResult);
    }
}

export class CheckInResult {
    constructor(public status: CheckInStatus,
                public message: string,
                public dueAmount?: Number,
                public currency?: string) {}
}

export type CheckInStatus = "EVENT_NOT_FOUND" | "TICKET_NOT_FOUND" | "EMPTY_TICKET_CODE"
  | "INVALID_TICKET_CODE" | "INVALID_TICKET_STATE" | "ALREADY_CHECK_IN" | "MUST_PAY" | "OK_READY_TO_BE_CHECKED_IN"
  | "BADGE_SCAN_SUCCESS" | "BADGE_SCAN_ALREADY_DONE" | "SUCCESS" | "ERROR";

export const CheckInStatus = {
  SUCCESS: "SUCCESS" as CheckInStatus,
  ERROR: "ERROR" as CheckInStatus,
  MUST_PAY: "MUST_PAY" as CheckInStatus,
  ALREADY_CHECK_IN: "ALREADY_CHECK_IN" as CheckInStatus,
  EVENT_NOT_FOUND: "EVENT_NOT_FOUND" as CheckInStatus,
  TICKET_NOT_FOUND: "TICKET_NOT_FOUND" as CheckInStatus,
  EMPTY_TICKET_CODE: "EMPTY_TICKET_CODE" as CheckInStatus,
  INVALID_TICKET_CODE: "INVALID_TICKET_CODE" as CheckInStatus,
  INVALID_TICKET_STATE: "INVALID_TICKET_STATE" as CheckInStatus,
  OK_READY_TO_BE_CHECKED_IN: "OK_READY_TO_BE_CHECKED_IN" as CheckInStatus,
  BADGE_SCAN_SUCCESS: "BADGE_SCAN_SUCCESS" as CheckInStatus,
  BADGE_SCAN_ALREADY_DONE: "BADGE_SCAN_ALREADY_DONE" as CheckInStatus
};

export const WarningStatuses: CheckInStatus[] = [CheckInStatus.BADGE_SCAN_ALREADY_DONE];
export const SuccessStatuses: CheckInStatus[] = [CheckInStatus.SUCCESS, CheckInStatus.BADGE_SCAN_SUCCESS];


export const statusDescriptions: {[status: string]: string} = {
    "SUCCESS": "Success",
    "MUST_PAY": "Outstanding payment:",
    "ALREADY_CHECK_IN": "Ticket already checked in!!",
    "ERROR": "An error has occurred. Please try to reload the application.",
    "EVENT_NOT_FOUND": "Event not found. Please try to reload the application.",
    "TICKET_NOT_FOUND": "This Ticket does not belong to the current event. Please check the event name on the Ticket",
    "EMPTY_TICKET_CODE": "Invalid ticket code. Please scan the QR-Code again.",
    "INVALID_TICKET_CODE": "Invalid ticket code. Please report the issue to the organizers.",
    "INVALID_TICKET_STATE": "This ticket cannot be checked in. Please report the issue to the organizers.",
    "OK_READY_TO_BE_CHECKED_IN": "OK_READY_TO_BE_CHECKED_IN",
    "BADGE_SCAN_ALREADY_DONE": "Badge Scan already performed today.",
    "BADGE_SCAN_SUCCESS": "Badge Scan successful"
};

export interface AttendeeSearchResult {
    uuid: string;
    firstName: string;
    lastName: string;
    categoryName: string;
    additionalInfo?: {[key: string]: string[]};
    ticketStatus: string;
    amountToPay?: string;
}

const validator = new RegExp("^[^\\{\\}]+$");
export function isValidTicketCode(scan: string): boolean {
    return validator.test(scan);
}