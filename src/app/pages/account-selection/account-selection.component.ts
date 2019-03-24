import { Component, ElementRef, OnInit, OnChanges, ViewChild, NgZone } from "@angular/core";
import { ListView, ItemEventData } from "tns-core-modules/ui/list-view";
import { RouterExtensions } from "nativescript-angular/router"
import { Account, ScannedAccount } from "../../shared/account/account";
import { AccountService } from "../../shared/account/account.service";
import { AccountResponse, Maybe, Some, Nothing } from "../../shared/account/account";
import { defaultScanOptions } from '../../utils/barcodescanner';
import { ios } from "tns-core-modules/application";
import { isUndefined, isDefined } from "tns-core-modules/utils/types";
import { BarcodeScanner, ScanResult } from "nativescript-barcodescanner";
import { Subject, Observable } from "rxjs";
import { FeedbackService } from "~/app/shared/notification/feedback.service";

@Component({
    selector: "account-selection",
    templateUrl: "./account-selection.html",
    styleUrls: ["./account-selection-common.css", "./account-selection.css"],
})
export class AccountSelectionComponent implements OnInit, OnChanges {
    accounts: Array<Account> = [];
    isLoading: boolean;
    isIos: boolean;
    editModeEnabled: boolean = false;
    tapEmitter = new Subject<Account>();
    private editEnableSubject = new Subject<boolean>();
    editEnableObservable: Observable<boolean> = this.editEnableSubject.asObservable();
    private editedAccount: Account = null;
    @ViewChild("list") listViewContainer: ElementRef<ListView>;
    

    constructor(private accountService: AccountService, 
        private routerExtensions: RouterExtensions,
        private barcodeScanner: BarcodeScanner,
        private ngZone: NgZone,
        private feedbackService: FeedbackService) {
            this.isIos = !ios;
    }

    ngOnInit(): void {
        console.log("ngOnInit AccountSelection");
        this.accounts = this.accountService.getRegisteredAccounts();
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
        if(maybeScannedAccount.isPresent()) {
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
        if(this.editModeEnabled) {
            this.toggleEditMode();
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
                        this.processResponse(resp)
                    }), (err) => this.ngZone.run(() => {
                        console.log(err);
                        this.feedbackService.error('Cannot register a new Account. Please check your internet connection and retry.');
                        this.isLoading = false;
                    }));
        } catch(e) {
            console.log("error", e);
            this.feedbackService.error('Cannot register a new Account. Please re-scan the QR-Code(s).');
            this.isLoading = false;
        }
    }

    private parseScannedAccount(qrCodeParts: Array<string>): Maybe<ScannedAccount> {
        if(qrCodeParts.length >= 1 && qrCodeParts.every(v => v && v.length > 0)) {
            try {
                let scanResult = JSON.parse(qrCodeParts.join(""));
                if(isUndefined(scanResult.baseUrl) || [scanResult.username, scanResult.apiKey].every(isUndefined) || (isDefined(scanResult.username) && !isDefined(scanResult.password))) {
                    return new Nothing<ScannedAccount>();
                }
                return new Some<ScannedAccount>(new ScannedAccount(scanResult.baseUrl, scanResult.username, scanResult.apiKey, scanResult.password, scanResult.sslCert));
            } catch(e) {
                return new Nothing<ScannedAccount>();
            }
        }
    }

    manage(account: Account): void {
        if(this.isEditRequested(account)) {
            this.editedAccount = null;
        } else {
            this.routerExtensions.navigate(['/manage-account/', account.getKey()]);
        }
        
    }

    onLongPress(account: Account): void {
        this.editedAccount = account;
    }

    isEditRequested(account: Account): boolean {
        return this.editedAccount === account;
    }

    delete(account: Account): void {
        if(this.editModeEnabled || this.isEditRequested(account)) {
            let newAccounts = this.accountService.deleteAccount(account);
            this.accounts = newAccounts;
        }
    }
    
    toggleEditMode(): void {
        this.editModeEnabled = !this.editModeEnabled;
        console.log('updated editModeEnabled to ', this.editModeEnabled);
        this.editEnableSubject.next(this.editModeEnabled);
        this.refreshListView();
    }
    
    private refreshListView(): void {
        let view = this.getListView();
        if(view) {
            console.log("refreshing...");
            view.refresh();
        }
    }
    
    private getListView(): ListView {
        if(this.listViewContainer) {
            return this.listViewContainer.nativeElement;
        }
        return null;
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
    
    isIosEditButtonVisible() {
        return this.isIos && this.hasAccounts() && !this.editModeEnabled;
    }
    
    isIosDoneButtonVisible() {
        return this.isIos && this.hasAccounts() && this.editModeEnabled;
    }

}