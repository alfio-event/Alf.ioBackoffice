import { Component, Injectable, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute, Params } from "@angular/router";
import { RouterExtensions } from "@nativescript/angular";
import { AccountService } from "~/app/shared/account/account.service";
import { ScanService } from "~/app/shared/scan/scan.service";
import { Account, AccountType, EventConfiguration, supportsAttendeesSearch } from "~/app/shared/account/account";
import { defaultScanOptions } from '~/app/utils/barcodescanner';
import { TicketAndCheckInResult, CheckInStatus, statusDescriptions, UnexpectedError, Ticket, SuccessStatuses, WarningStatuses, AdditionalServiceInfo, FieldValueAndDescription } from '../../../shared/scan/scan-common';
import { BarcodeScanner, ScanResult } from "@nstudio/nativescript-barcodescanner";
import { keepAwake, allowSleepAgain } from "nativescript-insomnia";
import { Screen } from "@nativescript/core/platform";
import { VibrateService } from '~/app/shared/notification/vibrate.service';

@Component({
    moduleId: module.id,
    selector: "staff-event-detail",
    providers: [AccountService, ScanService],
    templateUrl: 'event-detail.html',
    styleUrls: ['./event-detail.scss']
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
    actionBarTitle: string;
    private result: TicketAndCheckInResult;


    constructor(private route: ActivatedRoute,
                private routerExtensions: RouterExtensions,
                private accountService: AccountService,
                private barcodeScanner: BarcodeScanner,
                private scanService: ScanService,
                private ngZone: NgZone,
                private vibrateService: VibrateService) {
    }

    onBackTap(): void {
        this.routerExtensions.back();
    }

    get supervisor(): boolean {
        return supportsAttendeesSearch(this.event)
            && this.account.accountType === AccountType.SUPERVISOR;
    }

    search(): void {
        this.routerExtensions.navigate(['/event-detail/', this.account.getKey(), "STAFF", this.event.key, 'search']);
    }

    ngOnInit(): void {
        this.route.params.forEach((params: Params) => {
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
    }

    ngOnDestroy(): void {
        allowSleepAgain().then(v => console.log("allowed to sleep"));
    }

    onPrimaryButtonTap(): void {
        if (this.isStatusMustPay()) {
            this.confirmPayment(this.code);
        } else {
            this.scan();
        }
    }

    scanResult(res: ScanResult) {
        this.ngZone.run(() => {
            this.isLoading = true;
            let scanResult = res.text;
            this.code = scanResult;
            let start = new Date().getTime();
            this.scanService.checkIn(this.event.key, this.account, scanResult)
                    .subscribe(res => {
                        this.displayResult(res);
                        console.log("Check-in result received after", new Date().getTime() - start);
                    }, err => {
                        let errorDetail: TicketAndCheckInResult = null;
                        if (err instanceof TicketAndCheckInResult) {
                            errorDetail = err;
                        } else {
                            errorDetail = new UnexpectedError(err);
                        }
                        this.displayResult(errorDetail);
                    }, () => this.ngZone.run(() => this.isLoading = false));
        });
    }

    scan(): void {
        this.isLoading = true;
        this.barcodeScanner.scan(defaultScanOptions())
            .then((res) => setTimeout(() => this.scanResult(res), 10), (error) => {
                console.log("handling scan error", error);
                this.cancel();
            });
    }

    confirmPayment(code: string): void {
        this.isLoading = true;
        this.scanService.confirmPayment(this.event.key, this.account, code)
                    .subscribe(res => this.displayResult(res), err => {
                            this.displayResult(new UnexpectedError(err));
                        }, () => this.ngZone.run(() => this.isLoading = false));
    }

    getStatusIcon(): string {
        let code: number = 0xf1f0;
        if (this.isStatusSuccess()) {
            code = 0xf26b;
        } else if (this.isStatusMustPay()) {
            code = 0xf19a;
        } else if (this.isStatusWarning()) {
            code = 0xf1f7;
        }
        return String.fromCharCode(code);
    }

    isStatusSuccess(): boolean {
        return SuccessStatuses.indexOf(this.status) > -1;
    }

    isStatusError(): boolean {
        return !this.isStatusSuccess()
            && !this.isStatusMustPay()
            && !this.isStatusWarning();
    }

    isStatusWarning(): boolean {
        return WarningStatuses.indexOf(this.status) > -1;
    }

    isStatusMustPay(): boolean {
        return this.status === CheckInStatus.MUST_PAY;
    }

    cancel(): void {
        this.isLoading = false;
        this.ticket = undefined;
        this.status = undefined;
        this.code = undefined;
        this.message = undefined;
    }

    getPrimaryButtonText(): string {
        // Scan Attendees
        if (!this.status) {
            return "Scan Attendees";
        } else if (this.isStatusSuccess() || this.isStatusWarning()) {
            return "Scan Next";
        } else if (this.status === CheckInStatus.MUST_PAY) {
            return "Confirm Payment";
        } else {
            return "Rescan";
        }
    }

    get notificationBoxClass(): string {
        if (!this.isLoading && this.isStatusSuccess()) {
            return "ck-animate ck-" + (this.result.boxColor || "none");
        }
        return "";
    }

    get additionalServicesInfo(): Array<AdditionalServiceInfo> {
        return this.result?.additionalServices ?? [];
    }

    get additionalFields(): Array<FieldValueAndDescription> {
        return this.result?.fieldsToDisplay ?? [];
    }

    get hasAdditionalFields(): boolean {
        return (this.result?.additionalServices?.length ?? 0) > 0
            || (this.result?.fieldsToDisplay?.length ?? 0) > 0
    }

    get resultRows(): string {
        return this.hasAdditionalFields ? "auto, *, 70" : "*, auto, 70";
    }

    /**
     * In order to have enough room on screen for the additional items,
     * we have to hide the check-in stats on smaller screens
     */
    get displayCheckInStats(): boolean {
        return this.status == null || Screen.mainScreen.heightDIPs > 640;
    }

    private displayResult(res: TicketAndCheckInResult): void {
        this.ngZone.run(() => {
            this.result = res;
            this.status = res ? res.result.status : CheckInStatus.ERROR;
            this.message = statusDescriptions[this.status];
            if (this.status === CheckInStatus.MUST_PAY) {
                let formattedAmount = res.result.currency + res.result.dueAmount;
                this.message += " " + formattedAmount;
            }
            this.ticket = res ? res.ticket : null;
            if (this.isStatusSuccess()) {
                // notify success
                this.vibrateService.success();
            } else {
                // notify error
                this.vibrateService.error();
            }
            this.isLoading = false;
        });
    }
}
