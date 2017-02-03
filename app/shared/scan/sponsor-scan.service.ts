import { Injectable } from "@angular/core";
import { Http, Headers, Response } from "@angular/http";
import { Observable, Subject } from 'rxjs';

import { SponsorScan, ScanStatus, Ticket } from "./sponsor-scan";
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
        return this.http.post(account.url+'/api/attendees/sponsor-scan/bulk', toSend.map(scan=> new SponsorScanRequest(eventKey, scan.code)), {
            headers: authorization(account.username, account.password)
        }).map(data => data.json()).subscribe(payload => {
            let a = <Array<any>> payload;
            a.forEach(scan => this.changeStatusFor(eventKey, (<Ticket> scan.ticket).uuid, ScanStatus.DONE, <Ticket> scan.ticket));
            this.emitFor(eventKey);
            this.process(eventKey, account);
        }, error => {
            toSend.forEach(scan => this.changeStatusFor(eventKey, scan.code, ScanStatus.ERROR, null));
            this.emitFor(eventKey);
            console.log('error while bulk scanning:', error);
            this.process(eventKey, account);
        });
        
    }

    private emitFor(eventKey) {
        this.sources[eventKey].next(this.sponsorScans[eventKey]);
    }

    private process(eventKey: string, account: Account) {
        let toSend = this.findAllStatusNew(eventKey);
        if(toSend.length > 0) {
            this.emitFor(eventKey);
            toSend.forEach(scan => this.changeStatusFor(eventKey, scan.code, ScanStatus.IN_PROCESS, null));
            this.bulkScanUpload(eventKey, account, toSend);
        } else {
            this.doSetTimeoutProcess(eventKey, account);
        }
    }

    private changeStatusFor(eventKey: string, uuid: string, status: ScanStatus, ticket: Ticket) {
        this.sponsorScans[eventKey].filter(scan => scan.code === uuid).forEach(scan => {
            scan.status = status;
            if(ticket) {
                scan.ticket = ticket;
            }
        });
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