import { EventHeaderComponent } from './pages/event-header/event-header.component';
import { NgModule, Injector } from "@angular/core";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NativeScriptHttpModule } from "nativescript-angular/http";
import { NativeScriptModule } from "nativescript-angular/platform";
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

@NgModule({
    imports: [
        NativeScriptModule,
        NativeScriptFormsModule,
        AlfioHttpsModule,
        NativeScriptRouterModule,
        NativeScriptRouterModule.forRoot(routes),
        AccountModule
    ],
    declarations: [
        AppComponent,
        EventHeaderComponent,
        IosAccountIconComponent,
        ...navigatableComponents
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}