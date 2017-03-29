import { Injectable, OnInit, Injector } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { AccountService } from "./account.service";
import { Account } from "./account";
import { Subject } from "rxjs";

@Injectable()
export class AccountSelectionNotifier implements OnInit {

    private currentAccountId: string = null;
    private _accountService: AccountService = null;
    private accountSubject = new Subject<Account>();
    accountObservable = this.accountSubject.asObservable();

    constructor(private route: ActivatedRoute, 
                private injector: Injector) { }

    ngOnInit(): void {
        this.route.params.forEach((params: Params) => {
            let id = params['accountId'];
            if(id != this.currentAccountId) {
                this.getAccountService().findAccountById(id).ifPresent((account: Account) => {
                    this.accountSubject.next(account);
                    this.currentAccountId = id;
                });
            }
        })
    }

    private getAccountService() : AccountService {
        if(this._accountService != null) {
            return this._accountService;
        }
        this._accountService = this.injector.get(AccountService);
        return this._accountService;
    }
}