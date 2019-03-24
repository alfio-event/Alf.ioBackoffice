import { NgModule } from "@angular/core";
import { StorageService } from "../../shared/storage/storage.service";

@NgModule({
    providers: [
        StorageService
    ]
})
export class StorageModule {
}