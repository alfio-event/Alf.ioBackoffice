import { Injectable } from "@angular/core";
import { Http, Headers, Response } from "@angular/http";
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/interval';
import { Account } from "../account/account";
import { authorization } from "~/utils/network-util";


@Injectable()
export class StatisticsService {
    constructor(private http: Http) {}

    public retrieveForEvent(account: Account, eventName: string) : Observable<CheckInStatistics> {
        return Observable.interval(10000)
            .switchMap(() => this.http.get(`${account.url}/admin/api/check-in/event/${eventName}/statistics`, { headers: authorization(account.username, account.password)}))
            .map(resp => resp.json());
    }
}

export interface CheckInStatistics {
    totalAttendees: Number;
    checkedIn: Number;
    lastUpdate: Number;
}