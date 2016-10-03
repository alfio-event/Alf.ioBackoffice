export class Account {
    url: string;
    username: string;
    password: string;
    accountType: AccountType;
    configurations: Array<EventConfiguration>;


    getKey(): string {
        return this.username + "@" + this.url;
    }

}

export class EventConfiguration {
    key: string;
    imageUrl: string;
}

export enum AccountType {
    STAFF,
    SPONSOR
}