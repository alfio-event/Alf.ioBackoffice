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
        this.loadSavedAccounts();
    }

    public registerNewAccount(url: string, username: string, password: string) {
        let headers = new Headers();
        let token = this.encodeBase64(username + ":" + password);
        headers.append("Authorization", "Basic " + token);
        console.log("calling: " + url);
        return this.http.get(url + "/admin/api/user-type", {
            headers: headers
        })
        .map(response => response.text())
        .map(data => {
            let account = new Account();
            account.url = url;
            account.username = username;
            account.password = password;
            account.accountType = data === "SPONSOR" ? AccountType.SPONSOR : AccountType.STAFF;
            account.configurations = [];
            let newAccountKey = account.getKey();
            if (!this.accounts.has(newAccountKey)) {
                console.log("account does not exist. Inserting...");
                this.accounts.set(newAccountKey, account);
                this.persistAccounts();
                console.log("accounts persisted.");
                return account;
            } else {
                console.log("Account exists. Doing nothing");
                return null;
            }
        }).catch(error => {
            console.log("got error! ");
            console.log(JSON.stringify(error));
            return Observable.throw(error);
        });
    }

    public getRegisteredAccounts(): Array<Account> {
        let result = new Array<Account>();
        for(var value of this.accounts.values()) {
            result.push(value);
        }
        return result;
    }

    private loadSavedAccounts() {
        let savedData = appSettings.getString(ACCOUNTS_KEY, "--");
        console.log("loaded saved data: "+savedData);
        if(savedData !== "--") {
            console.log("parsing saved data...");
            this.accounts = <Map<string, Account>>JSON.parse(savedData);
        }
    }

    private persistAccounts() {
        appSettings.setString(ACCOUNTS_KEY, JSON.stringify(this.accounts));
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