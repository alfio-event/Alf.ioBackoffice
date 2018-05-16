import { Injectable, OnInit, Injector } from "@angular/core";
import { Router, ActivatedRoute, Params, Event, RoutesRecognized } from "@angular/router";
import { AccountService } from "./account.service";
import { Account } from "./account";
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/filter';

@Injectable()
export class AccountSelectionNotifier implements OnInit {

    private currentAccountId: string = null;
    private _accountService: AccountService = null;
    private accountSelectedSubject: Subject<Account>;
    private accountScannedSubject: Subject<Account>;
    accountSelectedObservable: Observable<Account>;
    accountScannedObservable: Observable<Account>;

    constructor(private router: Router,
                private route: ActivatedRoute, 
                private injector: Injector) {
        this.accountSelectedSubject = new Subject<Account>();
        this.accountSelectedObservable = this.accountSelectedSubject.asObservable();
        this.accountScannedSubject = new Subject<Account>();
        this.accountScannedObservable = this.accountScannedSubject.asObservable();
        let extractRegex = new RegExp("^\/manage-account\/(.+)$")
        this.router.events
            .filter((event: Event) => event instanceof RoutesRecognized)
            .filter((event: RoutesRecognized) => extractRegex.test(event.urlAfterRedirects))
            .subscribe((event: RoutesRecognized) => {
                
                let result = extractRegex.exec(event.urlAfterRedirects)[1];
                if(result && decodeURIComponent(result) != this.currentAccountId) {
                    let id = decodeURIComponent(result);
                    this.getAccountService().findAccountById(id).ifPresent((account: Account) => {
                        this.accountSelectedSubject.next(account);
                        this.currentAccountId = id;
                    });
                } 
            });
    }

    ngOnInit(): void {
        
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