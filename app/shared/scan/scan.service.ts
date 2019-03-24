import { Injectable } from "@angular/core";
import { TicketAndCheckInResult, InvalidQrCode, isValidTicketCode } from './scan-common';
import { Account } from "../account/account";
import { authorization } from "../../utils/network-util";
import { Observable, throwError } from "rxjs";
import { tap } from 'rxjs/operators';
import { HttpClient } from "@angular/common/http";


@Injectable()
export class ScanService {
    constructor(private http: HttpClient) {
    }

    public checkIn(eventKey: string, account: Account, scan: string): Observable<TicketAndCheckInResult> {
        if(isValidTicketCode(scan)) {
            let split = scan.split("/");
            return this.performCheckIn(account, `${account.url}/admin/api/check-in/event/${eventKey}/ticket/${split[0]}`, scan);
        } else {
            return throwError(new InvalidQrCode("Invalid QR-Code!"));
        }
    }

    public confirmPayment(eventKey: string, account: Account, scan: string): Observable<TicketAndCheckInResult> {
        let split = scan.split("/");
        return this.performCheckIn(account, `${account.url}/admin/api/check-in/event/${eventKey}/ticket/${split[0]}/confirm-on-site-payment`, scan);
    }

    private performCheckIn(account: Account, url: string, scan: string): Observable<TicketAndCheckInResult> {
        let start = new Date().getTime();
        return this.http.post<TicketAndCheckInResult>(url, {"code": scan}, {
            headers: authorization(account.apiKey, account.username, account.password)
        }).pipe(tap(() => {
            console.log("1st stop, elapsed", new Date().getTime() - start);
        }));
    }
}
