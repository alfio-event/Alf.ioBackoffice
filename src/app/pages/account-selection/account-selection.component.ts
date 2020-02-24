import { Component, ElementRef, OnInit, OnChanges, ViewChild, NgZone } from "@angular/core";
import { RadListView, ListViewEventData } from "nativescript-ui-listview";
import { RouterExtensions } from "nativescript-angular/router";
import { Account, ScannedAccount } from "../../shared/account/account";
import { AccountService } from "../../shared/account/account.service";
import { AccountResponse, Maybe, Some, Nothing } from "../../shared/account/account";
import { defaultScanOptions } from '../../utils/barcodescanner';
import { isUndefined, isDefined } from "tns-core-modules/utils/types";
import { BarcodeScanner, ScanResult } from "nativescript-barcodescanner";
import { FeedbackService } from "../../shared/notification/feedback.service";
import { ObservableArray } from "tns-core-modules/data/observable-array/observable-array";

@Component({
    selector: "account-selection",
    templateUrl: "./account-selection.html",
    styleUrls: ["./account-selection.scss"],
})
export class AccountSelectionComponent implements OnInit, OnChanges {
    accounts: ObservableArray<Account> = new ObservableArray<Account>();
    isLoading: boolean;
    private editModeEnabled: boolean = false;
    private editedAccount: Account = null;

    constructor(private accountService: AccountService,
        private routerExtensions: RouterExtensions,
        private barcodeScanner: BarcodeScanner,
        private ngZone: NgZone,
        private feedbackService: FeedbackService) {
    }

    ngOnInit(): void {
        console.log("ngOnInit AccountSelection");
        this.accounts.push(this.accountService.getRegisteredAccounts());
        console.log("accounts", this.accounts.length);
        this.isLoading = false;
    }

    ngOnChanges(): void {
        console.log("ngOnChanges");
    }

    hasAccounts(): boolean {
        return this.accounts.length > 0;
    }

    onScanResult(result: ScanResult): void {
        let maybeScannedAccount = this.parseScannedAccount([result.text]);
        if (maybeScannedAccount.isPresent()) {
            let account = maybeScannedAccount.value;
            this.accountService.notifyAccountScan(account);
            this.barcodeScanner.stop().then((() => this.registerNewAccount(account)));
        } else {
            this.feedbackService.error('Invalid QR-Code. Please retry.');
        }
    }

    cancelScan(): void {
        this.barcodeScanner.stop();
    }

    requestQrScan(): void {
        if (this.editModeEnabled) {
            return;
        }
        let scanOptions = defaultScanOptions();
        this.barcodeScanner.scan(scanOptions)
            .then(result => this.onScanResult(result), (error) => {
                console.log("No scan: " + error);
                this.isLoading = false;
            });

    }

    private registerNewAccount(account: ScannedAccount): void {
        try {
            this.isLoading = true;
            this.accountService.registerNewAccount(account.url, account.apiKey, account.username, account.password, account.sslCert)
                .subscribe(resp => this.ngZone.run(() => {
                        this.processResponse(resp);
                    }), (err) => this.ngZone.run(() => {
                        console.log(err);
                        this.feedbackService.error('Cannot register a new Account. Please check your internet connection and retry.');
                        this.isLoading = false;
                    }));
        } catch (e) {
            console.log("error", e);
            this.feedbackService.error('Cannot register a new Account. Please re-scan the QR-Code(s).');
            this.isLoading = false;
        }
    }

    private parseScannedAccount(qrCodeParts: Array<string>): Maybe<ScannedAccount> {
        if (qrCodeParts.length >= 1 && qrCodeParts.every(v => v && v.length > 0)) {
            try {
                let scanResult = JSON.parse(qrCodeParts.join(""));
                if (isUndefined(scanResult.baseUrl) || [scanResult.username, scanResult.apiKey].every(isUndefined) || (isDefined(scanResult.username) && !isDefined(scanResult.password))) {
                    return new Nothing<ScannedAccount>();
                }
                return new Some<ScannedAccount>(new ScannedAccount(scanResult.baseUrl, scanResult.username, scanResult.apiKey, scanResult.password, scanResult.sslCert));
            } catch (e) {
                return new Nothing<ScannedAccount>();
            }
        }
    }

    onSwipeCellStarted(args: ListViewEventData) {
        this.editModeEnabled = true;
        const swipeLimits = args.data.swipeLimits;
        swipeLimits.left = 150;
        swipeLimits.right = 0;
        swipeLimits.treshold = 70;
    }

    onSwipeCellFinished(args: ListViewEventData) {
        this.editModeEnabled = args.data.x !== 0;
        console.log("swipe finished. Edit mode is enabled", this.editModeEnabled);
    }

    onItemSelected(args: ListViewEventData): void {
        if (this.editModeEnabled) {
            return;
        }
        const listView = args.object as RadListView;
        const account = listView.getSelectedItems()[0] as Account;
        this.routerExtensions.navigate(['/manage-account/', account.getKey()]);
    }

    select(account: Account): void {
        if (this.editModeEnabled) {
            return;
        }
        this.routerExtensions.navigate(['/manage-account/', account.getKey()]);
    }

    isEditRequested(account: Account): boolean {
        return this.editedAccount === account;
    }

    onDeleteButtonTap(args: ListViewEventData) {
        const indexToDelete = this.accounts.indexOf(args.object.bindingContext);
        if (indexToDelete > -1) {
            const accountToDelete = this.accounts.getItem(indexToDelete);
            this.accountService.deleteAccount(accountToDelete);
            this.accounts.splice(indexToDelete, 1);
            this.editModeEnabled = false;
        }
    }

    private processResponse(accountResponse: AccountResponse) {
        console.log("success!");
        if (!accountResponse.isExisting()) {
            console.log("pushing itemResult");
            this.accounts.push(accountResponse.getAccount());
            console.log("done. current list size: " + this.accounts.length);
        }
        this.isLoading = false;
    }

}