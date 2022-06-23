import { defaultScanOptions } from '../../../utils/barcodescanner';
import { SponsorScan, ScanResult, ScanStatus } from '../../../shared/scan/sponsor-scan';
import { Component, ElementRef, Injectable, OnInit, OnDestroy, ViewChild, NgZone, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Params } from "@angular/router";
import { RouterExtensions } from "@nativescript/angular";
import { AccountService } from "../../../shared/account/account.service";
import { SponsorScanService } from "../../../shared/scan/sponsor-scan.service";
import { Account, EventConfiguration } from "../../../shared/account/account";
import * as Email from "nativescript-email";
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { encodeBase64 } from '../../../utils/network-util';
import { forcePortraitOrientation, enableRotation } from '../../../utils/orientation-util';
import { Device } from "@nativescript/core/platform";
import { VibrateService } from '../../../shared/notification/vibrate.service';
import { FeedbackService } from '../../../shared/notification/feedback.service';
import { ListViewEventData, RadListView } from 'nativescript-ui-listview';
import { Subject, Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { android } from "@nativescript/core/application";
import { ObservableArray } from '@nativescript/core';

@Component({
    moduleId: module.id,
    selector: "sponsor-event-detail",
    templateUrl: './event-detail.html',
    styleUrls: ['./event-detail-common.scss']
})
@Injectable()
export class SponsorEventDetailComponent implements OnInit, OnDestroy {

    account: Account;
    event: EventConfiguration;
    scans = new ObservableArray<SponsorScan>();
    private dataReceived = new Subject<Date>();
    @ViewChild("scanList", { static: false })
    private scanView: ElementRef<RadListView>;

    constructor(private route: ActivatedRoute,
                private routerExtensions: RouterExtensions,
                private accountService: AccountService,
                private barcodeScanner: BarcodeScanner,
                private sponsorScanService: SponsorScanService,
                private ngZone: NgZone,
                private vibrateService: VibrateService,
                private feedbackService: FeedbackService) {
    }

    onBackTap(): void {
        this.routerExtensions.back();
    }

    ngOnInit(): void {
        this.route.params.subscribe((params: Params) => {
            console.log("params", params['accountId'], params['eventId']);
            let id = params['accountId'];
            let eventId = params['eventId'];
            this.accountService.findAccountById(id).ifPresent(account => {
                this.account = account;
                this.event = this.account.configurations.filter(c => c.key === eventId)[0];
                this.sponsorScanService.destroyForEvent(this.event.key);
                this.sponsorScanService.getForEvent(this.event.key, this.account).subscribe(list => {
                    console.log("received ", list.length);
                    this.scans.splice(0);
                    this.scans.push(list);
                    this.dataReceived.next(new Date());
                });
                let list = this.sponsorScanService.loadInitial(this.event.key);
                if (list) {
                    this.scans.push(list);
                }
            });
        });
        if (Device.deviceType === 'Phone') {
            forcePortraitOrientation();
        }
    }

    ngOnDestroy(): void {
        if (this.event && this.event.key) {
            this.sponsorScanService.destroyForEvent(this.event.key);
        }
        enableRotation();
    }

    requestQrScan(): void {
        let scanOptions = defaultScanOptions();
        scanOptions.continuousScanCallback = (res) => setTimeout(() => {
            console.log("scanned", res.text);
            let result = this.sponsorScanService.scan(this.event.key, this.account, res.text);
            switch (result) {
                case ScanResult.OK: {
                    this.vibrateService.success();
                    this.feedbackService.success('Scan enqueued!');
                    break;
                }
                case ScanResult.DUPLICATE: {
                    this.vibrateService.warning();
                    this.feedbackService.warning('Already scanned');
                    break;
                }
                case ScanResult.INVALID: {
                    this.vibrateService.error();
                    this.feedbackService.error('Invalid code');
                    break;
                }
            }
        }, 10);
        scanOptions.reportDuplicates = true;
        scanOptions.closeCallback = () => this.forceRefreshList();

        this.barcodeScanner.scan(scanOptions)
            .then(() => {
                    console.log("barcode scanner exited");
                    this.forceRefreshList();
                }, (error) => {
                    console.log("No scan: " + error);
                    this.forceRefreshList();
                });
    }

    private forceRefreshList(): void {
        if (android && this.scanView != null) {
            setTimeout(() => {
                this.scanView.nativeElement.refresh();
                console.log("forced scanView refresh...");
            });
        }
    }

    forceUpload(): void {
        this.sponsorScanService.forceProcess(this.event.key, this.account);
    }

    // from http://stackoverflow.com/a/12646864
    shuffleArray<T>(array: Array<T>): void {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    shuffle(): void {
        const array = this.scans.slice();
        this.shuffleArray(array);
        this.scans = new ObservableArray<SponsorScan>(array);
    }

    sendByEmail(): void {
        let file = encodeBase64(this.scans.map(s => s.code).join('\n'));
        Email.compose({
            subject: `Data for event ${this.event.name}`,
            body: `Here attached the scanned data from account ${this.account.username}`,
            to: [],
            attachments: [
                {
                    fileName: `${this.event.key}-attendees.txt`,
                    path: `base64://${file}`,
                    mimeType: 'text/plain'
                }],
            appPickerTitle: 'Compose with..' // for Android, default: 'Open with..'
        }).then(
            function() {
                console.log("Email composer closed");
            }, function(err) {
                console.log("Error: " + err);
            });
    }

    select(eventData: ListViewEventData): void {
        let item = this.scans.getItem(eventData.index);
        if (item.code != null) {
            this.routerExtensions.navigate(['/attendee-detail/', this.account.getKey(), this.event.key, item.code]);
        }
    }

    private listenToChanges(): Observable<Date> {
        return this.dataReceived.asObservable();
    }

    onPullToRefreshInitiated(args: ListViewEventData) {
        const listView = args.object;
        this.forceUpload();
        this.listenToChanges() // not ideal, but it's the best we can do with the current implementation
            .pipe(timeout(2000))
            .subscribe({
                next: d => this.ngZone.run(() => {
                    listView.notifyPullToRefreshFinished();
                }),
                error: () => this.ngZone.run(() => {
                    listView.notifyPullToRefreshFinished();
                    if (listView.ios) {
                        listView.scrollToIndex(0, true);
                    }
                })
            });
    }

    get rowLayout(): string {
        return this.scans.length > 0 ? "70, *, auto, 70" : "70, 10, *, 70";
    }
}