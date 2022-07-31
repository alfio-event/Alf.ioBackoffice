import { Injectable } from "@angular/core";
const ACCOUNTS_KEY = "ALFIO_ACCOUNTS";

import { Account, AccountType, EventConfiguration, AccountsArray, AccountResponse, Maybe, ScannedAccount, RemoteAccount } from "./account";
import { AccountSelectionNotifier } from "./account-selection-notifier";
import { map, switchMap, catchError } from 'rxjs/operators';
import { Observable, throwError } from "rxjs";

import { HttpClient } from "@angular/common/http";
import { StorageService } from "../storage/storage.service";
import { authorization } from "../../utils/network-util";
import { dataDeserialize } from "@nativescript/core/utils";

@Injectable()
export class AccountService {
    private accounts: AccountsArray;

    constructor(private http: HttpClient,
                private accountSelectionNotifier: AccountSelectionNotifier,
                private storage: StorageService) {
        this.accounts = this.loadSavedAccounts();
    }

    public registerNewAccount(url: string, apiKey: string, username: string, password: string, sslCert: string): Observable<AccountResponse> {
        let baseUrl = url.endsWith("/") ? url.substring(0, url.length - 1) : url;
        if (apiKey == null || username != null || password != null) {
            return throwError(() => new Error("Unsupported configuration. Make sure you're scanning an API Key"));
        }
        return this.http.get<RemoteAccount>(`${baseUrl}/admin/api/user/details`, {
                headers: authorization(apiKey, username, password)
            }).pipe(
                map(data => {
                    console.log("got user type", data.userType);
                    let account = new Account();
                    account.url = baseUrl;
                    account.apiKey = apiKey;
                    account.username = username;
                    account.password = password;
                    account.description = data.description;
                    account.accountType = this.detectAccountType(data.userType);
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
                    return throwError(() => new Error('Cannot register a new Account. Please check your internet connection and retry.'));
                })
            );
    }

    private detectAccountType(userType: string): AccountType {
        if (userType === "SPONSOR") {
            return AccountType.SPONSOR;
        } else if (userType === "CHECK_IN_SUPERVISOR") {
            return AccountType.SUPERVISOR;
        }
        return AccountType.STAFF;
    }

    private safeParse(data: string): string {
        try {
            return JSON.parse(data);
        } catch (e) {
            return data;
        }
    }

    public getRegisteredAccounts(): Array<Account> {
        let elements = [];
        this.accounts.getAllAccounts().forEach(a => elements.push(a));
        return elements;
    }

    public deleteAccount(account: Account): Array<Account> {
        let newArray = this.accounts.getAllAccounts().filter(it => it.getKey() !== account.getKey());
        this.accounts = new AccountsArray(newArray);
        this.persistAccounts();
        return this.getRegisteredAccounts();
    }

    public findAccountById(id: string): Maybe<Account> {
        return this.accounts.get(id);
    }

    public loadEventsForAccount(account: Account): Observable<Array<EventConfiguration>> {
        return this.http.get<Array<EventConfiguration>>(account.url + "/admin/api/events", {
            headers: authorization(account.apiKey, account.username, account.password)
        });
    }

    public updateEventsForAccount(key: string, events: Array<EventConfiguration>) {
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

    private loadSavedAccounts(): AccountsArray {
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