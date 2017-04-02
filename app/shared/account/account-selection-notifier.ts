import { Injectable, OnInit, Injector } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { AccountService } from "./account.service";
import { Account } from "./account";
import { Subject, Observable } from "rxjs";

@Injectable()
export class AccountSelectionNotifier implements OnInit {

    private currentAccountId: string = null;
    private _accountService: AccountService = null;
    private accountSelectedSubject: Subject<Account>;
    private accountScannedSubject: Subject<Account>;
    accountSelectedObservable: Observable<Account>;
    accountScannedObservable: Observable<Account>;

    constructor(private route: ActivatedRoute, 
                private injector: Injector) {
        this.accountSelectedSubject = new Subject<Account>();
        this.accountSelectedObservable = this.accountSelectedSubject.asObservable();
        this.accountScannedSubject = new Subject<Account>();
        this.accountScannedObservable = this.accountScannedSubject.asObservable();
    }

    ngOnInit(): void {
        this.route.params.forEach((params: Params) => {
            let id = params['accountId'];
            if(id != this.currentAccountId) {
                this.getAccountService().findAccountById(id).ifPresent((account: Account) => {
                    this.accountSelectedSubject.next(account);
                    this.currentAccountId = id;
                });
            }
        })
    }

    notifyAccountScanned(account: Account): void {
        console.log("notifyAccountScanned", account.getKey());
        this.accountScannedSubject.next(account);
    }

    private getAccountService() : AccountService {
        if(this._accountService != null) {
            return this._accountService;
        }
        this._accountService = this.injector.get(AccountService);
        return this._accountService;
    }
}