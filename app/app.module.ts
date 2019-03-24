import { EventHeaderComponent } from './pages/event-header/event-header.component';
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptAnimationsModule } from "nativescript-angular/animations";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { AccountModule } from "./shared/account/account.module"
import { IosAccountIconComponent } from "./pages/ios-account-icon/ios-account-icon.component";
import { AppComponent } from "./app.component";
import { routes, navigatableComponents } from "./app.routing";
import { CurrencyPipe } from "@angular/common";
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { StatisticsModule } from './shared/statistics/statistics.module';
import { CheckInStatsComponent } from './pages/checkin-stats/checkin-stats.component';
import { StorageModule } from './shared/storage/storage.module';
import { registerElement } from "nativescript-angular/element-registry";
import { HttpClientModule } from '@angular/common/http';
registerElement("BarcodeScanner", () => require("nativescript-barcodescanner").BarcodeScannerView);

@NgModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [
        NativeScriptModule,
        NativeScriptFormsModule,
        NativeScriptRouterModule,
        NativeScriptRouterModule.forRoot(routes),
        NativeScriptAnimationsModule,
        HttpClientModule,
        AccountModule,
        StatisticsModule,
        StorageModule
    ],
    declarations: [
        AppComponent,
        EventHeaderComponent,
        CheckInStatsComponent,
        IosAccountIconComponent,
        ...navigatableComponents
    ],
    providers: [ CurrencyPipe, BarcodeScanner ],
    bootstrap: [AppComponent]
})
export class AppModule {}