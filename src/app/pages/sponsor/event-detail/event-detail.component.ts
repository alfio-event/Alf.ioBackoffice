import { defaultScanOptions } from '../../../utils/barcodescanner';
import { SponsorScan, ScanResult, ScanStatus } from '../../../shared/scan/sponsor-scan';
import { Component, ElementRef, Injectable, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { ActivatedRoute, Params } from "@angular/router";
import { ListView, ItemEventData } from "tns-core-modules/ui/list-view";
import { RouterExtensions } from "nativescript-angular/router";
import { AccountService } from "../../../shared/account/account.service";
import { SponsorScanService } from "../../../shared/scan/sponsor-scan.service";
import { Account, EventConfiguration } from "../../../shared/account/account";
import * as Email from "nativescript-email";
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { encodeBase64 } from '../../../utils/network-util';
import { forcePortraitOrientation, enableRotation } from '../../../utils/orientation-util';
import { device } from "tns-core-modules/platform";
import { VibrateService } from '../../../shared/notification/vibrate.service';
import { FeedbackService } from '../../../shared/notification/feedback.service';
import { ListViewEventData } from 'nativescript-ui-listview';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
import { Subject, Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Component({
    moduleId: module.id,
    selector: "sponsor-event-detail",
    templateUrl: './event-detail.html',
    styleUrls: ['./event-detail-common.css']
})
@Injectable()
export class SponsorEventDetailComponent implements OnInit, OnDestroy {

    isLoading: boolean;
    account: Account;
    event: EventConfiguration;
    scans = new ObservableArray<SponsorScan>();
    private dataReceived = new Subject<Date>();
    private lastUpdate: number = 0;
    private interval: number;

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
        this.isLoading = true;
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
                this.isLoading = false;
            });
        });
        if (device.deviceType === 'Phone') {
            forcePortraitOrientation();
        }
    }

    ngOnDestroy(): void {
        if (this.event && this.event.key) {
            this.sponsorScanService.destroyForEvent(this.event.key);
        }
        if (this.interval) {
            clearInterval(this.interval);
        }
        enableRotation();
    }

    requestQrScan(): void {
        this.isLoading = true;
        let scanOptions = defaultScanOptions();
        this.lastUpdate = new Date().getTime();
        scanOptions.continuousScanCallback = (res) => setTimeout(() => {
            this.lastUpdate = new Date().getTime();
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
        scanOptions.closeCallback = () => setTimeout(() => {
            this.ngZone.run(() => this.isLoading = false);
            clearInterval(this.interval);
        }, 10);
        scanOptions.reportDuplicates = true;

        let warningDisplayed = false;
        this.interval = setInterval(() => {
            let current = new Date().getTime();
            let elapsed = current - this.lastUpdate;
            if (elapsed > 45 * 1000) {
                clearInterval(this.interval);
                this.barcodeScanner.stop()
                    .then(() => {
                        this.feedbackService.warning("Timed out");
                        this.toggleLoading(false);
                    });
            } else if (elapsed > (30 * 1000) && !warningDisplayed) {
                warningDisplayed = true;
                this.feedbackService.warning("Camera will be deactivated in 15 sec.");
            }
        }, 1000);

        this.barcodeScanner.scan(scanOptions)
            .then(() => {
                    console.log("barcode scanner exited");
                    clearInterval(this.interval);
                    this.toggleLoading(false);
                }, (error) => {
                    console.log("No scan: " + error);
                    this.toggleLoading(false);
                });
    }

    private toggleLoading(state: boolean): void {
        this.ngZone.run(() => this.isLoading = state);
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
        this.shuffleArray(this.scans.slice());
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
        this.forceUpload();
        this.listenToChanges() // not ideal, but it's the best we can do with the current implementation
            .pipe(timeout(5000))
            .subscribe({
                next: d => {
                    args.object.notifyPullToRefreshFinished();
                },
                error: () => {
                    args.object.notifyPullToRefreshFinished();
                }
            });
    }
}