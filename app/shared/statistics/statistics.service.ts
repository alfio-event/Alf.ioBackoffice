import { Injectable } from "@angular/core";
import { Http, Headers, Response } from "@angular/http";
import { Account } from "../account/account";
import { authorization } from "~/utils/network-util";
import { timer, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';


@Injectable()
export class StatisticsService {
    constructor(private http: Http) {}

    public retrieveForEvent(account: Account, eventName: string) : Observable<CheckInStatistics> {
        return timer(200,5000)
            .pipe(
                switchMap(() => this.http.get(`${account.url}/admin/api/check-in/event/${eventName}/statistics`, { headers: authorization(account.username, account.password)})),
                map(resp => resp.json())
            );
    }
}

export interface CheckInStatistics {
    totalAttendees: Number;
    checkedIn: Number;
    lastUpdate: Number;
}