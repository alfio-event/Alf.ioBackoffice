import { Injectable } from "@angular/core";
import { Observable, Subject } from 'rxjs';
import { SponsorScan } from "./sponsor-scan";
import { Http, Headers, Response } from "@angular/http";
import { Account } from "../account/account";

@Injectable()
export class SponsorScanService {
    
    constructor(private http: Http) {
    }

    public scan(eventKey: string, uuid: string) : void {
    }

    public getForEvent(eventKey: string, account: Account) : Observable<Array<SponsorScan>> {
        let subj = new Subject<Array<SponsorScan>>();
        return subj.asObservable();
    }
}