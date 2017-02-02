import { Injectable, OnInit } from "@angular/core";
import { Http, Headers, Response } from "@angular/http";
import { Observable, ReplaySubject } from "rxjs/Rx";
import "rxjs/add/operator/do";
import "rxjs/add/operator/map";
import "rxjs/add/operator/switchMap";
var appSettings = require("application-settings");
const ACCOUNTS_KEY = "ALFIO_ACCOUNTS";

import { Account, AccountType, EventConfiguration, AccountsArray, AccountResponse, Maybe, Pair, Some, Nothing } from "./account";

@Injectable()
export class AccountService {
    private accounts: AccountsArray;

    constructor(private http: Http) {
        this.accounts = this.loadSavedAccounts();
    }

    public registerNewAccount(url: string, username: string, password: string): Observable<AccountResponse> {
        return this.http.get(url + "/admin/api/user-type", {
                headers: this.authorization(username, password)
            })
            .map(response => response.text())
            .map(data => {
                console.log("got user type", data);
                let account = new Account();
                account.url = url;
                account.username = username;
                account.password = password;
                account.accountType = data === "SPONSOR" ? AccountType.SPONSOR : AccountType.STAFF;
                account.configurations = [];
                let newAccountKey = account.getKey();
                let maybeExisting = this.accounts.get(newAccountKey);
                return new AccountResponse(account, maybeExisting.isPresent());
            }).switchMap(data => {
                return this.loadEventsForAccount(data.getAccount())
                    .map(configurations => {
                        let account = data.getAccount();
                        account.configurations = configurations;
                        return new AccountResponse(account, data.isExisting());
                    });
            }).map(accountResponse => {
                let account = accountResponse.getAccount();
                this.accounts.set(account.getKey(), account);
                this.persistAccounts();
                console.log("accounts persisted.");
                return accountResponse;
            }).catch(error => {
                console.log("got error! ");
                console.log(JSON.stringify(error));
                return Observable.throw(error);
            });
    }

    public getRegisteredAccounts(): Array<Account> {
        let elements = [];
        this.accounts.getAllAccounts().forEach(a => elements.push(a));
        return elements;
    }

    public findAccountById(id: string): Maybe<Account> {
        return this.accounts.get(id);
    }

    public loadEventsForAccount(account: Account): Observable<Array<EventConfiguration>> {
        return this.http.get(account.url + "/admin/api/events", {
            headers: this.authorization(account.username, account.password)
        }).map(data => data.json());
    }

    public updateEventsForAccount(key:string, events: Array<EventConfiguration>) {
        console.log("updating account configurations, events size:", events.length);
        this.accounts.get(key).ifPresent(v => v.configurations = events);
        console.log("done. Persisting...");
        this.persistAccounts();
    }

    private authorization(username: string, password: string): Headers {
        let headers = new Headers();
        headers.append("Authorization", "Basic " + this.encodeBase64(username + ":" + password));
        return headers;
    }

    private loadSavedAccounts() :AccountsArray {
        let savedData = appSettings.getString(ACCOUNTS_KEY, "--");
        if (savedData !== "--") {
            return new AccountsArray(JSON.parse(savedData).map(obj => {
                let account = new Account();
                account.url = obj.url;
                account.username = obj.username;
                account.password = obj.password;
                account.accountType = <number>obj.accountType;
                account.configurations = (<Array<any>>obj.configurations);
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
        appSettings.setString(ACCOUNTS_KEY, serializedElements);
        console.log("done.");
    }

    private encodeBase64(str: string) {
        var padChar = '=';
        var alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        var getByte = function (s, i) {
            var cc = s.charCodeAt(i);
            if (cc > 255) {
                throw "INVALID_CHARACTER_ERR: DOM Exception 5";
            }
            return cc;
        };
        var b10, i;
        var b64Chars = [];
        var iMax = str.length - str.length % 3;
        for (i = 0; i < iMax; i += 3) {
            b10 = (getByte(str, i) << 16) |
                (getByte(str, i + 1) << 8) |
                getByte(str, i + 2);
            b64Chars.push(alpha.charAt(b10 >> 18));
            b64Chars.push(alpha.charAt((b10 >> 12) & 0x3F));
            b64Chars.push(alpha.charAt((b10 >> 6) & 0x3f));
            b64Chars.push(alpha.charAt(b10 & 0x3f));
        }
        switch (str.length - iMax) {
            case 1:
                b10 = getByte(str, i) << 16;
                b64Chars.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
                    padChar + padChar);
                break;
            case 2:
                b10 = (getByte(str, i) << 16) | (getByte(str, i + 1) << 8);
                b64Chars.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
                    alpha.charAt((b10 >> 6) & 0x3F) + padChar);
                break;
        }
        return b64Chars.join('');
    }

}