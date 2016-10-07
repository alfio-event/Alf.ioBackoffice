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