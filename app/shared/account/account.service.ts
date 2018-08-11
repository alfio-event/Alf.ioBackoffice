import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
const ACCOUNTS_KEY = "ALFIO_ACCOUNTS";

import { Account, AccountType, EventConfiguration, AccountsArray, AccountResponse, Maybe, ScannedAccount } from "./account";
import { AccountSelectionNotifier } from "./account-selection-notifier";
import { authorization } from "~/utils/network-util";
import { map, switchMap, catchError } from 'rxjs/operators';
import { Observable } from "rxjs";
import { StorageService } from "~/shared/storage/storage.service";

@Injectable()
export class AccountService {
    private accounts: AccountsArray;

    constructor(private http: Http, 
                private accountSelectionNotifier: AccountSelectionNotifier,
                private storage: StorageService) {
        this.accounts = this.loadSavedAccounts();
    }

    public registerNewAccount(url: string, apiKey: string, username: string, password: string, sslCert: string): Observable<AccountResponse> {
        return this.http.get(url + "/admin/api/user/details", {
                headers: authorization(apiKey, username, password)
            }).pipe(
                map(response => response.json()),
                map(data => {
                    console.log("got user type", data.userType);
                    let account = new Account();
                    account.url = url;
                    account.apiKey = apiKey;
                    account.username = username;
                    account.password = password;
                    account.description = data.description;
                    account.accountType = data.userType === "SPONSOR" ? AccountType.SPONSOR : AccountType.STAFF;
                    account.configurations = [];
                    account.sslCert = sslCert;
                    let newAccountKey = account.getKey();
                    let maybeExisting = this.accounts.get(newAccountKey);
                    return new AccountResponse(account, maybeExisting.isPresent());
                }),
                switchMap(data => {
                    return this.loadEventsForAccount(data.getAccount())
                        .pipe(map(configurations => {
                            let account = data.getAccount();
                            account.configurations = configurations;
                            return new AccountResponse(account, data.isExisting());
                        }));
                }),
                map(accountResponse => {
                    let account = accountResponse.getAccount();
                    this.accounts.set(account.getKey(), account);
                    this.persistAccounts();
                    console.log("accounts persisted.");
                    return accountResponse;
                }),
                catchError(error => {
                    console.log("got error! ");
                    console.log(JSON.stringify(error));
                    return Observable.throw(error);
                })
            );
    }

    private safeParse(data: string): string {
        try {
            return JSON.parse(data);
        } catch(e) {
            return data;
        }
    }

    public getRegisteredAccounts(): Array<Account> {
        let elements = [];
        this.accounts.getAllAccounts().forEach(a => elements.push(a));
        return elements;
    }

    public deleteAccount(account: Account): Array<Account> {
        let newArray = this.accounts.getAllAccounts().filter(it => it.getKey() != account.getKey());
        this.accounts = new AccountsArray(newArray);
        this.persistAccounts();
        return this.getRegisteredAccounts();
    }

    public findAccountById(id: string): Maybe<Account> {
        return this.accounts.get(id);
    }

    public loadEventsForAccount(account: Account): Observable<Array<EventConfiguration>> {
        return this.http.get(account.url + "/admin/api/events", {
            headers: authorization(account.apiKey, account.username, account.password)
        }).pipe(map(data => data.json()));
    }

    public updateEventsForAccount(key:string, events: Array<EventConfiguration>) {
        console.log("updating account configurations, events size:", events.length);
        this.accounts.get(key).ifPresent(v => {
            v.lastUpdate = new Date();
            v.configurations = events;
        });
        console.log("done. Persisting...");
        this.persistAccounts();
    }

    public notifyAccountScan(scannedAccount: ScannedAccount): void {
        let account = new Account();
        account.url = scannedAccount.url;
        account.apiKey = scannedAccount.apiKey;
        account.username = scannedAccount.username;
        account.password = scannedAccount.password;
        account.sslCert = scannedAccount.sslCert;
        this.accountSelectionNotifier.notifyAccountScanned(account);
    }

    private loadSavedAccounts() :AccountsArray {
        let savedData = this.storage.getOrDefault(ACCOUNTS_KEY, "--");
        if (savedData !== "--") {
            return new AccountsArray(JSON.parse(savedData).map(obj => {
                let account = new Account();
                account.url = obj.url;
                account.apiKey = obj.apiKey;
                account.username = obj.username;
                account.password = obj.password;
                account.description = obj.description;
                account.accountType = <number>obj.accountType;
                account.configurations = (<Array<any>>obj.configurations);
                account.sslCert = obj.sslCert;
                return account;
            }));
        }
        let empty = new AccountsArray([]);
        return empty;
    }

    private persistAccounts() {
        let elements = this.accounts.getAllAccounts();
        let serializedElements = JSON.stringify(elements);
        console.log("serializing...");
        this.storage.saveValue(ACCOUNTS_KEY, serializedElements);
        console.log("done.");
    }
}