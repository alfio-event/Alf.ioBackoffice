import { defaultScanOptions } from '../../../utils/barcodescanner';
import { SponsorScan, ScanResult, ScanStatus } from '../../../shared/scan/sponsor-scan';
import { Component, ElementRef, Injectable, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { ActivatedRoute, Params } from "@angular/router";
import { ListView } from "tns-core-modules/ui/list-view"
import { RouterExtensions } from "nativescript-angular/router";
import { AccountService } from "../../../shared/account/account.service";
import { SponsorScanService } from "../../../shared/scan/sponsor-scan.service"
import { Account, EventConfiguration } from "../../../shared/account/account";
import * as Email from "nativescript-email";
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { encodeBase64 } from '../../../utils/network-util';
import { forcePortraitOrientation, enableRotation } from '../../../utils/orientation-util';
import * as application from "tns-core-modules/application";
import { ios as iosUtils } from "tns-core-modules/utils/utils";
import { VibrateService } from '~/app/shared/notification/vibrate.service';
import { FeedbackService } from '~/app/shared/notification/feedback.service';

@Component({
    moduleId: module.id,
    selector: "sponsor-event-detail",
    providers: [AccountService, SponsorScanService],
    templateUrl: './event-detail.html',
    styleUrls: ['./event-detail-common.css']
})
@Injectable()
export class SponsorEventDetailComponent implements OnInit, OnDestroy {

    isLoading: boolean;
    account: Account;
    event: EventConfiguration;
    scans: Array<SponsorScan> = [];
    private lastUpdate: number = 0;
    @ViewChild("list") listViewContainer: ElementRef;
    private listView: ListView;
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

    onBackTap() {
        this.routerExtensions.back();
    }

    ngOnInit() {
        this.scans = [];
        this.isLoading = true;
        this.route.params.subscribe((params: Params) => {
            console.log("params", params['accountId'], params['eventId'])
            let id = params['accountId'];
            let eventId = params['eventId'];
            this.accountService.findAccountById(id).ifPresent(account => {
                this.account = account;
                this.event = this.account.configurations.filter(c => c.key === eventId)[0];
                this.sponsorScanService.getForEvent(this.event.key, this.account).subscribe(list => {
                    console.log("received ", list.length);
                    this.ngZone.run(() => {
                        this.scans = list;
                        this.refreshListView();
                    });
                });
                let list = this.sponsorScanService.loadInitial(this.event.key);
                if(list) {
                    this.scans = list;
                }
                this.isLoading = false;
            });
        });
        if(!application.ios || iosUtils.getter(UIDevice, UIDevice.currentDevice).model != "iPad") {
            forcePortraitOrientation();
        }
    }

    ngOnDestroy() {
        if(this.event && this.event.key) {
            this.sponsorScanService.destroyForEvent(this.event.key);
        }
        if(this.interval) {
            clearInterval(this.interval);
        }
        enableRotation();
    }

    requestQrScan() {
        this.isLoading = true;
        let scanOptions = defaultScanOptions();
        this.lastUpdate = new Date().getTime();
        scanOptions.continuousScanCallback = (res) => setTimeout(() => {
            this.lastUpdate = new Date().getTime();
            console.log("scanned", res.text);
            let result = this.sponsorScanService.scan(this.event.key, this.account, res.text);
            switch(result) {
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
            if(elapsed > 45 * 1000) {
                clearInterval(this.interval);
                this.barcodeScanner.stop()
                    .then(() => {
                        this.feedbackService.warning("Timed out");
                        this.toggleLoading(false);
                    });
            } else if(elapsed > (30 * 1000) && !warningDisplayed) {
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

    //from http://stackoverflow.com/a/12646864
    shuffleArray<T>(array: Array<T>): void {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    shuffle(): void {
        this.shuffleArray(this.scans);
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

    iconForItem(item: SponsorScan): string {
        switch(item.status) {
            case ScanStatus.DONE:
                return String.fromCharCode(0xf26b);
            case ScanStatus.ERROR:
                return String.fromCharCode(0xf1f0);
            default:
                return String.fromCharCode(0xf30c);
        }
    }

    hasErrorStatus(item: SponsorScan) {
        return item.status === ScanStatus.ERROR;
    }

    hasSuccessStatus(item: SponsorScan) {
        return item.status === ScanStatus.DONE;
    }

    getPlaceholderText(item: SponsorScan) {
        if(this.hasErrorStatus(item)) {
            return "Invalid code";
        } else if(!this.hasSuccessStatus(item)) {
            return "Synchronization in progress...";
        }

    }
    
    private refreshListView(): void {
        let view = this.getListView();
        if(view) {
            console.log("refreshing...");
            view.refresh();
        }
    }
    
    private getListView(): ListView {
        if(this.listView) {
            return this.listView;
        } else if(this.listViewContainer) {
            let container = <ListView>this.listViewContainer.nativeElement;
            this.listView = container;
            return this.listView;
        }
        return null;
    }


}