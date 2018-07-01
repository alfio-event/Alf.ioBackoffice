import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { Account } from "../account/account";
import { authorization } from "~/utils/network-util";
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable()
export class StatisticsService {
    constructor(private http: Http) {}

    public retrieveForEvent(account: Account, eventName: string) : Observable<CheckInStatistics> {
        return this.http.get(`${account.url}/admin/api/check-in/event/${eventName}/statistics`, { headers: authorization(account.username, account.password)})
            .pipe(
                map(resp => resp.json())
            );
    }
}

export interface CheckInStatistics {
    totalAttendees: Number;
    checkedIn: Number;
    lastUpdate: Number;
}