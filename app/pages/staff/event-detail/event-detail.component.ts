import { Component, Injectable, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute, Params } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { AccountService } from "../../../shared/account/account.service";
import { ScanService } from "../../../shared/scan/scan.service"
import { Account, EventConfiguration } from "../../../shared/account/account";
import { defaultScanOptions } from '../../../utils/barcodescanner';
import { TicketAndCheckInResult, CheckInStatus, statusDescriptions, UnexpectedError, Ticket } from '../../../shared/scan/scan-common'
import { Vibrate } from 'nativescript-vibrate';
import { BarcodeScanner, ScanResult } from 'nativescript-barcodescanner';
import { keepAwake, allowSleepAgain } from "nativescript-insomnia";
import { forcePortraitOrientation, enableRotation } from '../../../utils/orientation-util';
import * as application from "tns-core-modules/application";
import { ios as iosUtils } from "tns-core-modules/utils/utils";

@Component({
    moduleId: module.id,
    selector: "staff-event-detail",
    providers: [AccountService, ScanService],
    templateUrl: 'event-detail.html',
    styleUrls: ['./event-detail.css']
})
@Injectable()
export class StaffEventDetailComponent implements OnInit, OnDestroy {

    isLoading: boolean = true;
    account: Account;
    event: EventConfiguration;
    code: string;
    status: CheckInStatus;
    message: string;
    detail: string;
    ticket: Ticket;
    scannerVisible: boolean = false;
    isIos: boolean;
    private vibrator = new Vibrate();
    actionBarTitle: string;
    
    
    constructor(private route: ActivatedRoute,
                private routerExtensions: RouterExtensions,
                private accountService: AccountService,
                private barcodeScanner: BarcodeScanner,
                private scanService: ScanService,
                private ngZone: NgZone) {
                    this.isIos = !application.android;
    }

    onBackTap(): void {
        this.routerExtensions.back();
    }

    ngOnInit(): void {
        this.route.params.forEach((params: Params) => {
            console.log("params", params['accountId'], params['eventId'])
            let id = params['accountId'];
            let eventId = params['eventId'];
            this.accountService.findAccountById(id).ifPresent(account => {
                this.account = account;
                this.event = this.account.configurations.filter(c => c.key === eventId)[0];
                this.actionBarTitle = this.event.name;
                this.isLoading = false;
            });
        });
        keepAwake().then(v => console.log("keeping the screen awake..."));
        if(!application.ios || iosUtils.getter(UIDevice, UIDevice.currentDevice).model != "iPad") {
            forcePortraitOrientation();
        }        
    }

    ngOnDestroy(): void {
        allowSleepAgain().then(v => console.log("allowed to sleep"));
        enableRotation();
    }

    onPrimaryButtonTap(): void {
        if(this.isStatusMustPay()) {
            this.confirmPayment(this.code);
        } else {
            this.scan();
        }
    }

    scanResult(res: ScanResult) {
        this.ngZone.run(() => {
            this.scannerVisible = false;
            this.isLoading = true;
            this.vibrator.vibrate(50);
            let scanResult = res.text;
            this.code = scanResult;
            let start = new Date().getTime();
            this.scanService.checkIn(this.event.key, this.account, scanResult)
                    .subscribe(res => {
                        this.displayResult(res);
                        console.log("Check-in result received after", new Date().getTime() - start);
                    }, err => {
                        let errorDetail : TicketAndCheckInResult = null;
                        if(err instanceof TicketAndCheckInResult) {
                            errorDetail = err;
                        } else {
                            errorDetail = new UnexpectedError(err);
                        }
                        this.displayResult(errorDetail);
                    }, () => this.ngZone.run(() => this.isLoading = false));
        });
    }

    scan(): void {
        let scanStart = new Date().getTime();
        if(this.isIos) {
            this.scannerVisible = true;
        } else {
            this.barcodeScanner.scan(defaultScanOptions())
                .then((res) => setTimeout(() => this.scanResult(res),10), (error) => {
                    console.log("handling scan error", error);
                    this.cancel();
                });
            this.isLoading = true;
        }
    }

    confirmPayment(code: string): void {
        this.isLoading = true;
        this.scanService.confirmPayment(this.event.key, this.account, code)
                    .subscribe(res => this.displayResult(res), err => {
                            this.displayResult(new UnexpectedError(err));
                        }, () => this.ngZone.run(() => this.isLoading = false));
    }

    getStatusIcon(): string {
        if(this.isStatusSuccess()) {
            return String.fromCharCode(0xf269);
        } else if (this.status == CheckInStatus.MUST_PAY) {
            return String.fromCharCode(0xf19a);
        } else {
            return String.fromCharCode(0xf135);
        }
    }

    isStatusSuccess(): boolean {
        return this.status == CheckInStatus.SUCCESS;
    }

    isStatusMustPay(): boolean {
        return this.status == CheckInStatus.MUST_PAY;
    }

    cancel(): void {
        this.isLoading = false;
        this.ticket = undefined;
        this.status = undefined;
        this.code = undefined;
        this.message = undefined;
        if(this.isIos) {
            this.barcodeScanner.stop().then(() => this.ngZone.run(() => this.scannerVisible = false));
        }
    }

    getPrimaryButtonText(): string {
        //Scan Attendees
        if(!this.status) {
            return "Scan Attendees";
        } else if(this.isStatusSuccess()) {
            return "Scan Next";
        } else if (this.status == CheckInStatus.MUST_PAY) {
            return "Confirm Payment";
        } else {
            return "Rescan";
        }
    }

    private displayResult(res: TicketAndCheckInResult): void {
        this.ngZone.run(() => {
            console.log(`********** received error: ${res.result.status}`)
            this.status = res ? res.result.status : CheckInStatus.ERROR;
            this.message = statusDescriptions[this.status];
            if(this.status == CheckInStatus.MUST_PAY) {
                let formattedAmount = res.result.currency + res.result.dueAmount;
                this.message += " " + formattedAmount;
            }
            this.ticket = res ? res.ticket : null;
            if(this.status == CheckInStatus.SUCCESS) {
                //notify success
                this.vibrator.vibrate([50, 50, 50]);
            } else {
                this.vibrator.vibrate(500);
                //notify error
            }
            this.isLoading = false;
        });
    }
}