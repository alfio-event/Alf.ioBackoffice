import { Injectable } from "@angular/core";
import { Http, Headers, Response } from "@angular/http";
import { authorization } from '../account/account.service';
import { Ticket, TicketAndCheckInResult } from './scan-common';
import { Account } from "../account/account";
import { Observable } from "rxjs/Observable";

@Injectable()
export class ScanService {
    constructor(private http: Http) {
    }

    public checkIn(eventKey: string, account: Account, scan: string): Observable<TicketAndCheckInResult> {
        let split = scan.split("/");
        return this.performCheckIn(account, `${account.url}/admin/api/check-in/event/${eventKey}/ticket/${split[0]}`, scan);
    }

    public confirmPayment(eventKey: string, account: Account, scan: string): Observable<TicketAndCheckInResult> {
        let split = scan.split("/");
        return this.performCheckIn(account, `${account.url}/admin/api/check-in/event/${eventKey}/ticket/${split[0]}/confirm-on-site-payment`, scan);
    }

    private performCheckIn(account: Account, url: string, scan: string): Observable<TicketAndCheckInResult> {
        let start = new Date().getTime();
        return this.http.post(url, {"code": scan}, {
            headers: authorization(account.username, account.password)
        }).map(r => {
            console.log("1st stop, elapsed", new Date().getTime() - start);
            return r.json();
        });
    }
}
