import {Component, NgZone, OnChanges, OnInit} from "@angular/core";
import {ListViewEventData, RadListView} from "nativescript-ui-listview";
import {RouterExtensions} from "@nativescript/angular";
import {Account, AccountResponse, Maybe, Nothing, ScannedAccount, Some} from "../../shared/account/account";
import {AccountService} from "../../shared/account/account.service";
import {isDefined, isUndefined} from "@nativescript/core/utils/types";
import {BarcodeScanner, ScanResult} from "@nstudio/nativescript-barcodescanner";
import {FeedbackService} from "../../shared/notification/feedback.service";
import {defaultScanOptions} from "~/app/utils/barcodescanner";
import {ObservableArray, Page, View} from "@nativescript/core";
import {OrientationService} from "~/app/shared/orientation.service";
import {Subscription} from "rxjs";

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
    private orientationSubscription?: Subscription;

    constructor(private accountService: AccountService,
        private routerExtensions: RouterExtensions,
        private barcodeScanner: BarcodeScanner,
        private ngZone: NgZone,
        private feedbackService: FeedbackService,
        private orientationService: OrientationService,
        private page: Page) {
    }

    ngOnInit(): void {
        console.log("ngOnInit AccountSelection");
        const newLength = this.accounts.push(...this.accountService.getRegisteredAccounts());
        console.log("accounts", newLength);
        this.isLoading = false;
        this.page.on('navigatingTo', () => {
            if (this.orientationSubscription == null) {
                this.orientationSubscription = this.orientationService.orientationChange().subscribe(data => {
                    console.log('Orientation changed', data);
                    // orientation changed. Force re-rendering to avoid stale objects
                    // on screen
                    this.isLoading = true;
                    setTimeout(() => this.isLoading = false);
                });
            }
        });
        this.page.on('navigatingFrom', () => {
            this.orientationSubscription?.unsubscribe();
            this.orientationSubscription = null;
        });
    }

    ngOnChanges(): void {
        console.log("ngOnChanges");
    }

    get hasAccounts(): boolean {
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
                .subscribe({
                    next: resp => this.ngZone.run(() => {
                        this.processResponse(resp);
                    }),
                    error: (err: Error) => this.ngZone.run(() => {
                        console.log(err);
                        this.feedbackService.error(err.message);
                        this.isLoading = false;
                    })
                });
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
        const actionView = args['object'].getViewById<View>('deleteBtn');
        const actualLabel = args['object'].getViewById<View>('deleteText');
        const padding = Math.round(actualLabel.getLocationOnScreen().x) + 5; // add extra margin because iOS, meh...
        const actionViewWidth = (padding * 2) + actionView.getMeasuredWidth();
        swipeLimits.left = actionViewWidth;
        swipeLimits.right = 0;
        swipeLimits.treshold = actionViewWidth / 2;
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
