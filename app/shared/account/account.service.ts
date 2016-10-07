import { Injectable, OnInit } from "@angular/core";
import { Http, Headers, Response } from "@angular/http";
import { Observable } from "rxjs/Rx";
import "rxjs/add/operator/do";
import "rxjs/add/operator/map";
var appSettings = require("application-settings");
const ACCOUNTS_KEY = "ALFIO_ACCOUNTS";

import { Account, AccountType, EventConfiguration } from "./account";

@Injectable()
export class AccountService {
    private accounts: Map<string, Account> = new Map<string, Account>();

    constructor(private http: Http) {
        console.log("Calling AccountService constructor");
        this.loadSavedAccounts();
    }

    public registerNewAccount(url: string, username: string, password: string) {
        console.log("calling: " + url);
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
                if (this.accounts.has(newAccountKey)) {
                    console.log("Account exists. Returning it...");
                    return new AccountResponse(this.accounts.get(newAccountKey), true);
                } else {
                    console.log("account does not exist. Inserting...");
                    this.accounts.set(newAccountKey, account);
                    this.persistAccounts();
                    console.log("accounts persisted.");
                    return new AccountResponse(account, false);
                }
            }).catch(error => {
                console.log("got error! ");
                console.log(JSON.stringify(error));
                return Observable.throw(error);
            });
    }

    public getRegisteredAccounts(): Array<Account> {
        let result = new Array<Account>();
        console.log("loading accounts", this.accounts.size);
        if (this.accounts.size == 0) {
            return result;
        }
        this.accounts.forEach((value, key) => {
            console.log("returning account with key", key);
            result.push(value);
        });
        console.log("returning result of size ", result.length);
        return result;
    }

    public findAccountById(id: string): Account {
        return this.accounts.get(id);
    }

    public loadEventsForAccount(account: Account) {
        return this.http.get(account.url + "/admin/api/events", {
            headers: this.authorization(account.username, account.password)
        }).map(data => data.json());
    }

    public updateEventsForAccount(account: Account, events: Array<EventConfiguration>) {
        console.log("updating account configurations");
        this.accounts.get(account.getKey()).configurations = events;
        console.log("done. Persisting...");
        this.persistAccounts();
    }

    private authorization(username: string, password: string): Headers {
        let headers = new Headers();
        headers.append("Authorization", "Basic " + this.encodeBase64(username + ":" + password));
        return headers;
    }

    private loadSavedAccounts() {
        let savedData = appSettings.getString(ACCOUNTS_KEY, "--");
        if (savedData !== "--") {
            console.log("parsing saved data...");
            let accountsArray = JSON.parse(savedData).map(obj => {
                let account = new Account();
                account.url = obj.url;
                account.username = obj.username;
                account.password = obj.password;
                account.accountType = <number>obj.accountType;
                account.configurations = (<Array<any>>obj.configurations);
                return account;
            });
            let accountsMap = new Map<string, Account>();
            accountsArray.forEach(a => accountsMap.set(a.getKey(), a));
            this.accounts = accountsMap;
        }
    }

    private persistAccounts() {
        let elements = this.getRegisteredAccounts();
        console.log("called persist accounts. Account size is ", this.accounts.size, elements.length);
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

export class AccountResponse {
    constructor(private account: Account, private existing: boolean) { }

    getAccount() {
        return this.account;
    }

    isExisting() {
        return this.existing;
    }
}