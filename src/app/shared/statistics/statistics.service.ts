import { Injectable } from "@angular/core";
import { Account } from "../account/account";
import { authorization } from "../../utils/network-util";
import { Observable } from 'rxjs';
import { HttpClient } from "@angular/common/http";


@Injectable()
export class StatisticsService {
    constructor(private http: HttpClient) {}

    public retrieveForEvent(account: Account, eventName: string) : Observable<CheckInStatistics> {
        return this.http.get<CheckInStatistics>(`${account.url}/admin/api/check-in/event/${eventName}/statistics`, { headers: authorization(account.apiKey)});
    }
}

export interface CheckInStatistics {
    totalAttendees: Number;
    checkedIn: Number;
    lastUpdate: Number;
}
