import { Injectable } from "@angular/core";
import { Http, Headers, Response } from "@angular/http";
import { Observable, Subject } from 'rxjs';

import { SponsorScan, ScanStatus } from "./sponsor-scan";
import { authorization } from '../account/account.service';
import { Account } from "../account/account";

@Injectable()
export class SponsorScanService  {

    private sponsorScans: {[eventKey: string] : Array<SponsorScan>} = {};
    private sources: {[eventKey: string] : Subject<Array<SponsorScan>>} = {};
    private timeoutIds: {[eventKey: string] : number} = {};
    
    constructor(private http: Http) {
    }

    public scan(eventKey: string, uuid: string) : void {
        if (this.sponsorScans[eventKey] === undefined) {
            this.sponsorScans[eventKey] = [];
        }
        this.sponsorScans[eventKey].push(new SponsorScan(uuid, ScanStatus.NEW, null));
    }

    private findAllStatusNew(eventKey: string) : Array<SponsorScan> {
        if(this.sponsorScans[eventKey] === undefined) {
            return [];
        }
        return this.sponsorScans[eventKey].filter(e => e.status == ScanStatus.NEW);
    }

    public destroyForEvent(eventKey: string) {
        clearTimeout(this.timeoutIds[eventKey]);
    }

    private bulkScanUpload(eventKey: string, account: Account, toSend: Array<SponsorScan>) {
        console.log('bulk scan upload of ', JSON.stringify(toSend));
        return this.http.post(account.url+'/api/attendees/sponsor-scan/bulk', toSend.map(scan=> new SponsorScanRequest(eventKey, scan.code)), {
            headers: authorization(account.username, account.password)
        }).map(data => data.json()).subscribe(payload => {
            let a = <Array<any>> payload;
            //TODO: mark status for toSend as DONE
            //TODO: emit changes
            this.process(eventKey, account);
        }, error => {
            //TODO: emit changes
            //TODO: mark status for toSend as ERROR
            console.log('error while bulk scanning:', error);
            this.process(eventKey, account);
        });
        
    }

    private process(eventKey: string, account: Account) {
        let toSend = this.findAllStatusNew(eventKey);
        if(toSend.length > 0) {
            //TODO mark status as IN_PROCESS
            //TODO: emit changes
            this.bulkScanUpload(eventKey, account, toSend);
        } else {
            this.doSetTimeoutProcess(eventKey, account);
        }
    }

    private doSetTimeoutProcess(eventKey: string, account: Account) {
        this.timeoutIds[eventKey] = setTimeout(() => {
            this.process(eventKey, account);
        }, 1000);

    }

    public getForEvent(eventKey: string, account: Account) : Observable<Array<SponsorScan>> {
        if(this.sources[eventKey]) {
            return this.sources[eventKey];
        }

        let subj = new Subject<Array<SponsorScan>>();
        this.sources[eventKey] = subj;

        this.doSetTimeoutProcess(eventKey, account);

        return subj.asObservable();
    }
    
}

class SponsorScanRequest {
    constructor(private eventName: string, private ticketIdentifier: string){}
}