import { EventHeaderComponent } from './pages/event-header/event-header.component';
import { NgModule, Injector } from "@angular/core";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NativeScriptHttpModule } from "nativescript-angular/http";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptAnimationsModule } from "nativescript-angular/animations";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { AccountModule } from "./shared/account/account.module"
import { IosAccountIconComponent } from "./pages/ios-account-icon/ios-account-icon.component";
import { AppComponent } from "./app.component";
import { routes, navigatableComponents } from "./app.routing";
import { RemoteConnectorService } from "./remote-connector.service";
import { BaseRequestOptions, Http } from "@angular/http";
import { AccountService } from "./shared/account/account.service";
import { ActivatedRoute } from "@angular/router";
import { AlfioHttpsModule } from "./alfio-https.module";
import { CurrencyPipe } from "@angular/common";
import { BarcodeScanner } from 'nativescript-barcodescanner';

@NgModule({
    imports: [
        NativeScriptModule,
        NativeScriptFormsModule,
        AlfioHttpsModule,
        NativeScriptRouterModule,
        NativeScriptRouterModule.forRoot(routes),
        NativeScriptAnimationsModule,
        AccountModule
    ],
    declarations: [
        AppComponent,
        EventHeaderComponent,
        IosAccountIconComponent,
        ...navigatableComponents
    ],
    providers: [ CurrencyPipe, BarcodeScanner ],
    bootstrap: [AppComponent]
})
export class AppModule {}