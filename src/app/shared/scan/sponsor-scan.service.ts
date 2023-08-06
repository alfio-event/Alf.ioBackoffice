import {Injectable} from "@angular/core";

import {
  checkInStatusToScanStatus,
  getPendingEventDataForSponsor,
  LabelLayout,
  LeadStatus,
  pendingScanKeyForAccount,
  ScanResult,
  ScanStatus,
  SponsorScan
} from "./sponsor-scan";
import {isValidTicketCode, Ticket, TicketAndCheckInResult} from "./scan-common";
import {Account, AdditionalButton} from "../account/account";
import {authorization, basicAuth} from "../../utils/network-util";
import {EMPTY, Observable, of, Subject} from "rxjs";
import {StorageService} from "../../shared/storage/storage.service";
import {HttpClient} from "@angular/common/http";
import {clearTimeout, setTimeout} from "@nativescript/core/timer";
import {catchError, map, tap} from "rxjs/operators";
import {loadOperatorName} from "~/app/utils/operatorNameUtils";
import {logIfDevMode} from "~/app/utils/systemUtils";

@Injectable()
export class SponsorScanService  {

  private sponsorScans: {[eventKey: string]: Array<SponsorScan>} = {};
  private sources: {[eventKey: string]: Subject<Array<SponsorScan>>} = {};
  private timeoutIds: {[eventKey: string]: number} = {};

  constructor(private http: HttpClient, private storage: StorageService) {
  }

  public loadLabelLayout(eventKey: string, account: Account): Observable<LabelLayout> {
      return this.http.get<LabelLayout>(`${account.url}/admin/api/check-in/${eventKey}/label-layout`, {
        headers: authorization(account.apiKey),
        observe: "response"
      }).pipe(
        map(r => {
          if (r.status === 200) {
            this.storage.saveValue('ALFIO_LABEL_LAYOUT_' + eventKey + account.getKey(), JSON.stringify(r.body));
            return r.body;
          }
          return null;
        }),
        catchError(() => {
          const json = this.storage.getOrDefault('ALFIO_LABEL_LAYOUT_' + eventKey + account.getKey());
          if (json != null) {
              return of(JSON.parse(json) as LabelLayout);
          }
          return of(null);
        }));
    }

    public scan(eventKey: string, account: Account, uuid: string, completeScan: string, labelLayout?: LabelLayout): ScanResult {

        if (!isValidTicketCode(uuid) || !/^[A-Za-z0-9\-]+$/.test(uuid)) {
            console.log(`invalid ticket code received: ${uuid}`);
            return ScanResult.INVALID;
        }

        if (!this.sponsorScans[eventKey]) {
            this.sponsorScans[eventKey] = [];
        }

        if (this.sponsorScans[eventKey].some(s => s.code === uuid)) {
            // already scanned
            return ScanResult.DUPLICATE;
        }

        this.sponsorScans[eventKey].push(new SponsorScan(uuid, ScanStatus.NEW, SponsorScanService.getTemporaryTicket(completeScan, labelLayout), null, LeadStatus.WARM));
        this.persistSponsorScans(eventKey, account);
        this.emitFor(eventKey);
        return ScanResult.OK;
    }

    private persistSponsorScans(eventKey: string, account: Account): void {
        if (this.sponsorScans[eventKey]) {
            this.storage.saveValue('ALFIO_SPONSOR_SCANS_' + eventKey + account.getKey(), JSON.stringify(this.sponsorScans[eventKey]));
        }
    }

    private static fixStatusOnLoad(status: ScanStatus): ScanStatus {
        if (status === ScanStatus.ERROR || status === ScanStatus.IN_PROCESS) {
            return ScanStatus.NEW;
        } else {
            return status;
        }
    }

    private loadIfExists(eventKey: string, account: Account): Array<SponsorScan> {
        let stringified = this.storage.getOrDefault('ALFIO_SPONSOR_SCANS_' + eventKey + account.getKey());
        if (stringified != null) {
            let found = <Array<SponsorScan>> JSON.parse(stringified);
            return found.map(sponsorScan => new SponsorScan(sponsorScan.code, SponsorScanService.fixStatusOnLoad(sponsorScan.status), sponsorScan.ticket, sponsorScan.notes, sponsorScan.leadStatus, sponsorScan.timestamp));
        } else {
            return undefined;
        }
    }

    private findAllStatusNew(eventKey: string): Array<SponsorScan> {
        if (!this.sponsorScans[eventKey]) {
            return [];
        }
        return this.sponsorScans[eventKey].filter(e => e.status === ScanStatus.NEW);
    }

    public destroyForEvent(eventKey: string): void {
        if (this.timeoutIds[eventKey] !== undefined) {
            console.log('Clear timeout for event ' + eventKey);
            clearTimeout(this.timeoutIds[eventKey]);
            this.timeoutIds[eventKey] = undefined;
        }
    }

    public persistPendingScans(eventKey: string, account: Account): void {
      const pending = (this.sponsorScans[eventKey] || []).filter(s => s.status !== ScanStatus.DONE);
      const pendingData = getPendingEventDataForSponsor(account, this.storage);
      if (pending.length > 0) {
        console.log("persisting sponsors scan pending count for event", eventKey, ":", pending.length);
        if (!pendingData.includes(eventKey)) {
          pendingData.push(eventKey);
          this.storage.saveValue(pendingScanKeyForAccount(account.getKey()), JSON.stringify(pendingData));
        }
      } else if (pendingData.includes(eventKey)) {
        const newData = pendingData.filter(k => k !== eventKey);
        this.storage.saveValue(pendingScanKeyForAccount(account.getKey()), JSON.stringify(newData));
      }
    }

    public forceProcess(eventKey: string, account: Account): void {
        this.process(eventKey, account, true);
    }

    public forceProcessForPastEvent(eventKey: string, account: Account): Observable<boolean> {
      console.log("force process for past event", eventKey);
      const existing = this.loadIfExists(eventKey, account);
      console.log("loaded existing", existing.length, existing.filter(s => s.isPending()).length);
      this.sponsorScans[eventKey] = existing;
      const subj = new Subject<Array<SponsorScan>>();
      this.sources[eventKey] = subj;
      this.forceProcess(eventKey, account);
      return subj.asObservable()
        .pipe(
          tap(() => console.log("result received!")),
          map((scans: Array<SponsorScan>) => scans.every(scan => scan.status === ScanStatus.DONE)),
          tap(result => {
            if (result) {
              this.persistPendingScans(eventKey, account);
            }
          })
        );
    }

    private bulkScanUpload(eventKey: string, account: Account, toSend: Array<SponsorScan>, oneShot: boolean): void {
        const operatorName = loadOperatorName(this.storage, eventKey, account);
        console.log("calling bulk scan upload for operator", operatorName);
        if (toSend == null || toSend.length === 0) {
            return;
        }
        this.http.post<Array<TicketAndCheckInResult>>(account.url + '/api/attendees/sponsor-scan/bulk', toSend.map(scan => new SponsorScanRequest(eventKey, scan.code, scan.notes, scan.leadStatus, scan.timestamp)), {
            headers: authorization(account.apiKey).set("Alfio-Operator", operatorName)
        }).subscribe({
          next: payload => {
            if (payload != null) {
              const requestResponseSameSize = payload.length === toSend.length;
              // if there is a result, we assume that it would contain the elements in the same order as we sent them.
              // If the size of the result is not equal to the size of the request, we skip the error.
              // this will be improved in a future release, by adding the scanned code as correlation ID.
              for (let i = 0; i < payload.length; i++) {
                let scan = payload[i];
                let uuid: string;
                if (scan.ticket) {
                  uuid = scan.ticket.uuid;
                } else if (requestResponseSameSize) {
                  uuid = toSend[i].code;
                }
                if (uuid != null) {
                  this.changeStatusFor(eventKey, uuid, checkInStatusToScanStatus(scan.result.status), scan.ticket, null, null);
                }
              }
              this.publishResults(eventKey, account, oneShot);
            }
          },
          error: err => {
            console.log('error while bulk scanning:', JSON.stringify(err));
            toSend.forEach(scan => this.changeStatusFor(eventKey, scan.code, ScanStatus.NEW, null, null, null));
            this.publishResults(eventKey, account, oneShot);
          }
        });
    }

    private publishResults(eventKey: string, account: Account, oneShot: boolean): void {
        this.persistSponsorScans(eventKey, account);
        this.persistPendingScans(eventKey, account);
        this.emitFor(eventKey);
        if (!oneShot) {
          // set timeout only if process is not "one shot"
          this.doSetTimeoutProcess(eventKey, account);
        }
    }

    private emitFor(eventKey: string): void {
        this.sources[eventKey].next(this.sponsorScans[eventKey]);
    }

    private process(eventKey: string, account: Account, oneShot: boolean = false): void {
        let toSend = this.findAllStatusNew(eventKey);
        logIfDevMode("toSend is", toSend.length);
        if (toSend.length > 0) {
            toSend.forEach(scan => this.changeStatusFor(eventKey, scan.code, ScanStatus.IN_PROCESS, scan.ticket, scan.notes, scan.leadStatus));
            this.bulkScanUpload(eventKey, account, toSend, oneShot);
        } else if (!oneShot) {
            this.doSetTimeoutProcess(eventKey, account);
        } else {
            this.persistPendingScans(eventKey, account);
            this.emitFor(eventKey);
        }
    }

    private changeStatusFor(eventKey: string, uuid: string, status: ScanStatus, ticket: Ticket, notes: string = null, leadStatus: LeadStatus): void {
        console.log('changing status for ', eventKey, uuid, status);
        this.sponsorScans[eventKey].filter(scan => scan.code === uuid).forEach(scan => {
            scan.status = status;
            if (SponsorScanService.isNotTemporary(ticket)) {
                scan.ticket = ticket;
            }
            if (notes != null) {
                scan.notes = notes;
            }
        });
    }

    private doSetTimeoutProcess(eventKey: string, account: Account): void {
        if (this.timeoutIds[eventKey] != null) {
            clearTimeout(this.timeoutIds[eventKey]);
        }

        this.timeoutIds[eventKey] = setTimeout(() => {
            this.process(eventKey, account);
        }, 1000);

    }

    public getForEvent(eventKey: string, account: Account): Observable<Array<SponsorScan>> {

        if (this.sources[eventKey]) {
            // we trigger the process timeout, in case there is something pending
            this.doSetTimeoutProcess(eventKey, account);
            return this.sources[eventKey];
        }

        let subj = new Subject<Array<SponsorScan>>();
        this.sources[eventKey] = subj;

        let saved = this.loadIfExists(eventKey, account);
        if (saved) {
            this.sponsorScans[eventKey] = saved;
        }

        this.doSetTimeoutProcess(eventKey, account);

        return subj.asObservable();
    }

    public loadInitial(eventKey: string): Array<SponsorScan> {
        return this.sponsorScans[eventKey] || [];
    }

    public update(eventKey: string, scan: SponsorScan): void {
        const notes = scan.notes != null ? scan.notes : "";
        this.changeStatusFor(eventKey, scan.code, ScanStatus.NEW, null, notes, scan.leadStatus);
    }

    public retrieveCustomLink(spec: AdditionalButton): Observable<{authenticatedLink: string}> {
      logIfDevMode('loading link', spec.linkGenerationEndpoint, spec.basicAuthUsername, spec.basicAuthPassword);
      if (spec.linkGenerationEndpoint != null && spec.basicAuthPassword != null && spec.basicAuthUsername != null) {
        logIfDevMode('parameters exist');
        return this.http.post<{authenticatedLink: string}>(spec.linkGenerationEndpoint, null, {
          headers: basicAuth(spec.basicAuthUsername, spec.basicAuthPassword)
        });
      }
      return EMPTY;
    }

    private static TEMPORARY_TICKET_ID = Number.MIN_VALUE;
    private static getTemporaryTicket(code: string, labelLayout?: LabelLayout): Ticket | null {
      if (labelLayout?.qrCode?.additionalInfo != null) {
        let additionalInfo = labelLayout.qrCode.additionalInfo;
        // additional info always come AFTER UUID, so we add a +1 because UUID is not included in the array
        const firstNameIndex = additionalInfo.findIndex(s => s === 'firstName') + 1;
        const lastNameIndex = additionalInfo.findIndex(s => s === 'lastName') + 1;
        const parts = code.split(labelLayout.qrCode.infoSeparator);
        if (firstNameIndex > 0 && lastNameIndex > 0 && parts.length > Math.max(firstNameIndex, lastNameIndex)) {
          return {
            id: SponsorScanService.TEMPORARY_TICKET_ID,
            uuid: '',
            status: '',
            categoryName: '',
            firstName: parts[firstNameIndex],
            lastName: parts[lastNameIndex],
            fullName: parts[firstNameIndex] + ' ' + parts[lastNameIndex]
          };
        }
      }
      return null;
    }

    public static isNotTemporary(ticket?: Ticket) {
        return ticket != null && ticket.id !== SponsorScanService.TEMPORARY_TICKET_ID;
    }


}

class SponsorScanRequest {
    constructor(private eventName: string, private ticketIdentifier: string, private notes: string, private leadStatus: string, timestamp: number) {}
}
