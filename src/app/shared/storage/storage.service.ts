import { Injectable } from "@angular/core";
import * as application from "@nativescript/core/application";
import { SecureStorage } from "@nativescript/secure-storage";

declare const kSecAttrAccessibleWhenUnlockedThisDeviceOnly;
@Injectable()
export class StorageService {
    private secureStorage: SecureStorage;
    constructor() {
        this.secureStorage = application.ios ? new SecureStorage(kSecAttrAccessibleWhenUnlockedThisDeviceOnly) : new SecureStorage();
    }

    public getOrDefault(key: string, defaultValue: string = null): string {
        return this.secureStorage.getSync({key: key}) || defaultValue;
    }

    public saveValue(key: string, value: string): void {
        this.secureStorage.setSync({key: key, value: value});
    }

    public removeValue(key: string): void {
        this.secureStorage.remove({ key });
    }
}
