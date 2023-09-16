import {Component, Inject, NgZone, OnInit} from "@angular/core";
import {DEVICE, RouterExtensions} from "@nativescript/angular";
import {Account, AccountResponse, Maybe, Nothing, ScannedAccount, Some} from "../../shared/account/account";
import {AccountService} from "../../shared/account/account.service";
import {isDefined, isUndefined} from "@nativescript/core/utils/types";
import {BarcodeScanner, ScanResult} from "@nstudio/nativescript-barcodescanner";
import {FeedbackService} from "../../shared/notification/feedback.service";
import {defaultScanOptions} from "~/app/utils/barcodescanner";
import {ObservableArray, Page} from "@nativescript/core";
import {OrientationService} from "~/app/shared/orientation.service";
import {Subscription} from "rxjs";
import {IDevice, platformNames} from "@nativescript/core/platform";

@Component({
    selector: "account-selection",
    templateUrl: "./account-selection.html",
    styleUrls: ["./account-selection.scss"],
})
export class AccountSelectionComponent implements OnInit {
    accounts: ObservableArray<Account> = new ObservableArray<Account>();
    isLoading: boolean;
    editModeEnabled: boolean = false;
    isIos: boolean;
    private orientationSubscription?: Subscription;

    constructor(private accountService: AccountService,
        private routerExtensions: RouterExtensions,
        private barcodeScanner: BarcodeScanner,
        private ngZone: NgZone,
        private feedbackService: FeedbackService,
        private orientationService: OrientationService,
        private page: Page,
        @Inject(DEVICE) device: IDevice) {
        this.isIos = device.os === platformNames.ios;
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

    refreshAccounts(args: {object: {refreshing: boolean}}): void {
        this.accountService.refreshAccounts()
            .subscribe({
                next: result => {
                    if (result) {
                        this.accounts.splice(0, this.accounts.length, ...this.accountService.getRegisteredAccounts());
                    }
                    args.object.refreshing = false;
                },
                error: () => {
                    args.object.refreshing = false;
                }
            })
    }

    private registerNewAccount(account: ScannedAccount): void {
        try {
            this.isLoading = true;
            this.accountService.registerNewAccount(account)
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
                return new Some<ScannedAccount>(new ScannedAccount(scanResult.baseUrl, scanResult.username, scanResult.password, scanResult.apiKey, scanResult.eventName, scanResult.configurationUrl));
            } catch (e) {
                return new Nothing<ScannedAccount>();
            }
        }
    }

    select(account: Account, index: number): void {
        if (this.editModeEnabled) {
            // deleting the element
            const accountToDelete = this.accounts.getItem(index);
            this.accountService.deleteAccount(accountToDelete);
            this.accounts.splice(index, 1);
            this.editModeEnabled = false;
        } else {
            this.routerExtensions.navigate(['/manage-account/', account.getKey()]);
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

    get itemLayout(): string {
        return this.editModeEnabled ? "60, *" : "40, *, 35";
    }

    toggleEditMode(): void {
        this.editModeEnabled = !this.editModeEnabled;
    }

    toggleLongPress() {
        if (!this.isIos) {
            this.toggleEditMode();
        }
    }
}
