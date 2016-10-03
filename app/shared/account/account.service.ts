import { Injectable, OnInit } from "@angular/core";
import { Http, Headers, Response } from "@angular/http";
import { Observable } from "rxjs/Rx";
import "rxjs/add/operator/do";
import "rxjs/add/operator/map";
var appSettings = require("application-settings");
var btoa = require("btoa");
const ACCOUNTS_KEY = "ALFIO_ACCOUNTS";

import { Account, AccountType, EventConfiguration } from "./account";

@Injectable()
export class AccountService implements OnInit {
    private accounts: Map<string, Account> = new Map<string, Account>();

    constructor(private http: Http) {}
    
    ngOnInit() {
        this.loadSavedAccounts();
    }

    public registerNewAccount(url: string, username: string, password: string) {
        let headers = new Headers();
        headers.append('Authorization', 'Basic '+ btoa(username + ":" + password));
        return this.http.get(url + "/admin/api/user-type", {
                headers: headers
            }).map(response => response.json())
            .do(data => {
                let account = new Account();
                account.url = url;
                account.username = username;
                account.password = password;
                account.accountType = data === "SPONSOR" ? AccountType.SPONSOR : AccountType.STAFF;
                account.configurations = [];
                let newAccountKey = account.getKey();
                if(!this.accounts.has(newAccountKey)) {
                    this.accounts.set(newAccountKey, account);
                    this.persistAccounts();
                    return account;
                } else {
                    return this.accounts.get(newAccountKey);
                }
            }).catch(error => {
                console.log(JSON.stringify(error.json()));
                return Observable.throw(error);
            });
    }

    public getRegisteredAccounts(): Array<Account> {
        return this.accounts.values();
    }

    private loadSavedAccounts() {
       this.accounts = JSON.parse(appSettings.getString(ACCOUNTS_KEY, "{}"));
    }

    private persistAccounts() {
        appSettings.setString(ACCOUNTS_KEY, JSON.stringify(this.accounts));
    }

}