import {Injectable} from "@angular/core";
import {
  Account,
  AccountResponse,
  AccountsArray,
  AccountType,
  EMPTY_USER_CONFIGURATION,
  EventConfiguration,
  Maybe,
  RemoteAccount,
  ScannedAccount,
  UserConfiguration
} from "./account";
import {AccountSelectionNotifier} from "./account-selection-notifier";
import {catchError, map, mergeMap, tap} from 'rxjs/operators';
import {Observable, of, throwError, zip} from "rxjs";

import {HttpClient} from "@angular/common/http";
import {StorageService} from "../storage/storage.service";
import {authorization} from "../../utils/network-util";
import {logIfDevMode} from "~/app/utils/systemUtils";

const ACCOUNTS_KEY = "ALFIO_ACCOUNTS";

@Injectable()
export class AccountService {
    private accounts: AccountsArray;

    constructor(private http: HttpClient,
                private accountSelectionNotifier: AccountSelectionNotifier,
                private storage: StorageService) {
        this.accounts = this.loadSavedAccounts();
    }

    public registerNewAccount(scannedAccount: ScannedAccount): Observable<AccountResponse> {
        const {url, apiKey, username, password} = scannedAccount;

        let baseUrl = url.endsWith("/") ? url.substring(0, url.length - 1) : url;
        if (apiKey == null || username != null || password != null) {
            return throwError(() => new Error("Unsupported configuration. Make sure you're scanning an API Key"));
        }
        return this.http.get<RemoteAccount>(`${baseUrl}/admin/api/user/details`, {
                headers: authorization(apiKey)
            }).pipe(
                map(data => {
                    console.log("got user type", data.userType);
                    let account = new Account();
                    account.url = baseUrl;
                    account.apiKey = apiKey;
                    account.configurationUrl = scannedAccount.configurationUrl;
                    account.eventName = scannedAccount.eventName;
                    account.description = data.description;
                    account.accountType = this.detectAccountType(data.userType);
                    account.configurations = [];
                    let newAccountKey = account.getKey();
                    let maybeExisting = this.accounts.get(newAccountKey);
                    return new AccountResponse(account, maybeExisting.isPresent());
                }),
                mergeMap(data => {
                    return zip(this.loadEventsForAccount(data.getAccount()), this.loadUserConfiguration(scannedAccount))
                      .pipe(map(([accountConfigurations, userConfiguration]) => {
                          let account = data.getAccount();
                          account.configurations = accountConfigurations;
                          account.userConfiguration = userConfiguration;
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
        } else if (userType === "SUPERVISOR") {
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
        if (account.accountType === AccountType.SPONSOR) {
          account.configurations.forEach(e => {
            this.storage.removeValue('ALFIO_SPONSOR_SCANS_' + e.key + account.getKey());
          });
        }
        this.persistAccounts();
        return this.getRegisteredAccounts();
    }

    public findAccountById(id: string): Maybe<Account> {
        return this.accounts.get(id);
    }

    public loadEventsForAccount(account: Account): Observable<Array<EventConfiguration>> {
        return this.http.get<Array<EventConfiguration>>(account.url + "/admin/api/events", {
            headers: authorization(account.apiKey)
        }).pipe(
          map((events) => {
            if (account.eventName == null) {
              console.log('eventName filter is null. Returning all events');
              return events;
            }
            return events.filter(e => e.key === account.eventName);
          })
        );
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
        account.eventName = scannedAccount.eventName;
        account.configurationUrl = scannedAccount.configurationUrl;
        this.accountSelectionNotifier.notifyAccountScanned(account);
    }

    private loadSavedAccounts(): AccountsArray {
        let savedData = this.storage.getOrDefault(ACCOUNTS_KEY, "--");
        if (savedData !== "--") {
            return new AccountsArray(JSON.parse(savedData).map(obj => {
                let account = new Account();
                account.url = obj.url;
                account.apiKey = obj.apiKey;
                account.description = obj.description;
                account.accountType = <number>obj.accountType;
                account.configurations = (<Array<any>>obj.configurations);
                account.userConfiguration = obj.userConfiguration || EMPTY_USER_CONFIGURATION;
                account.eventName = obj.eventName;
                account.configurationUrl = obj.configurationUrl;
                return account;
            }));
        }
      return new AccountsArray([]);
    }

    private persistAccounts() {
        let elements = this.accounts.getAllAccounts();
        let serializedElements = JSON.stringify(elements);
        console.log("serializing...");
        this.storage.saveValue(ACCOUNTS_KEY, serializedElements);
        console.log("done.");
    }

  private loadUserConfiguration(scannedAccount: ScannedAccount): Observable<UserConfiguration> {
    if (scannedAccount.configurationUrl != null) {
      logIfDevMode('configurationUrl is not empty', scannedAccount.configurationUrl);
      return this.http.get<UserConfiguration>(scannedAccount.configurationUrl)
        .pipe(
          tap(r => logIfDevMode('got', JSON.stringify(r))),
          catchError(err => {
          console.error('error while retrieving user configuration', err);
          return of(EMPTY_USER_CONFIGURATION);
          })
        )
    }
    return of(EMPTY_USER_CONFIGURATION);
  }
}
