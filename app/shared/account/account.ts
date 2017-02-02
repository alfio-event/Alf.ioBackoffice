import {ImageSource} from "image-source";

export class Account {
    url: string;
    username: string;
    password: string;
    accountType: AccountType;
    configurations: Array<EventConfiguration>;


    getKey(): string {
        return this.username + "@" + this.url;
    }

    containsEvent(key: String) : boolean {
        return this.configurations.some(ec => ec.key == key);
    }

}

export class EventConfiguration {
    key: string;
    imageUrl: string;
    name: string;
    url: string;
    begin: Date;
    end: Date;
    oneDay: boolean;
    location: string;
    apiVersion: number;
}

export enum AccountType {
    STAFF,
    SPONSOR
}

export class EventConfigurationSelection {
    public image: string;
    constructor(public eventConfiguration: EventConfiguration, public selected: boolean) { }
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

export class AccountsArray {

    constructor(private accounts: Array<Account>) {}


    getAllAccounts(): Array<Account> {
        return this.accounts;
    }

    get(key: string):Maybe<Account> {
        try {
            return this.find(key).map(pair => pair.second);
        } catch(e) {
            console.log(e);
            return new Nothing<Account>();
        }
    }

    set(key: string, value: Account) :void {
        let existing = this.find(key);
        if(existing.isPresent()) {
            this.accounts[existing.value.first] = existing.value.second;
        } else {
            this.accounts.push(value);
        }
    }

    private find(key:string): Maybe<Pair<number, Account>> {
        let result = this.accounts.map((v, i) => new Pair(i, v)).filter(a => a.second.getKey() === key);
        if(result.length > 0) {
            return new Some(result[0]);
        }
        return new Nothing<Pair<number, Account>>();
    }
}

export class Pair<X,Y> {
    constructor(public first:X, public second:Y) {}
}

export interface Maybe<X> {
    value: X;
    isPresent(): boolean;
    orElse(other: () => X):X;
    map<Y>(mapper: (X) => Y): Maybe<Y>;
    ifPresent(consumer: (X) => void);
}

export class Nothing<X> implements Maybe<X> {
    public value: X = undefined;

    isPresent() :boolean {
        return false;
    }
    orElse(other: () => X):X { 
        return other.apply(other);
    }
    map(mapper: (X) => any) :Maybe<any> {
        return this;
    }
    ifPresent(consumer: (X) => void) {}
}

export class Some<X> implements Maybe<X> {
    constructor(public value: X) {}

    isPresent() :boolean {
        return typeof this.value !== "undefined" && this.value !== null; 
    }

    orElse(other:() => X): X {
        return this.value;
    }

    map<Y>(mapper: (X) => Y): Some<Y> {
        return mapper.apply(this.value);
    }

    ifPresent(consumer: (X) => void) {
        consumer.apply(this.value);
    }
}