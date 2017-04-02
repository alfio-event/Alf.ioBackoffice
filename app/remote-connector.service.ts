import { RequestOptionsArgs, Response, ResponseOptions, ResponseType, Http, BaseRequestOptions, Headers } from "@angular/http";
import { Observable } from "rxjs/Observable";
import { Injectable, OnInit, Injector } from "@angular/core";
import * as Https from 'nativescript-https'
import { HttpResponseEncoding, HttpResponse } from "http";
import { ActivatedRoute, Params } from "@angular/router";
import { AccountService } from "./shared/account/account.service";
import { Account } from "./shared/account/account";
import { knownFolders, File } from 'file-system'
import { AccountSelectionNotifier } from "./shared/account/account-selection-notifier";
import { HttpsResponse, HttpsSSLPinningOptions } from "nativescript-https";

@Injectable()
export class RemoteConnectorService extends Http {

    private responseMapper = (response: HttpsResponse) => {
        //console.log("response mapper. Response: ", JSON.stringify(response));
        let isSuccessful = response.statusCode == 200;
        let responseOptions = new ResponseOptions({
            body: isSuccessful ? response.content : null,
            type: isSuccessful ? ResponseType.Default : ResponseType.Error,
            status: response.statusCode,
            statusText: ''
        });
        return new Response(responseOptions);
    };

    constructor(private accountSelectionNotifier: AccountSelectionNotifier) {
        super(null, null);
        console.log("registering RemoteConnectorService");
        Observable.merge(this.accountSelectionNotifier.accountSelectedObservable, this.accountSelectionNotifier.accountScannedObservable)
            .subscribe(account => this.onAccountSelected(account));
    }

    request(url: string, options?: RequestOptionsArgs): Observable<Response> {
        return Observable.throw("not implemented");
    }
    
    get(url: string, options?: RequestOptionsArgs): Observable<Response> {
        let promise = Https.request({
            url: url,
            method: 'GET',
            headers: this.convertHeaders(options.headers)
        });
        return Observable.fromPromise(promise).map(this.responseMapper);
    }

    post(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
        //console.log("calling post...")
        return Observable.fromPromise(Https.request({
            url: url,
            method: 'POST',
            headers: this.convertHeaders(options.headers),
            body: JSON.stringify(body)
        })).map(this.responseMapper);
    }
    
    put(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
        return Observable.throw("not implemented");
    }

    delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
        return Observable.throw("not implemented");
    }
    
    patch(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
        return Observable.throw("not implemented");
    }
    
    head(url: string, options?: RequestOptionsArgs): Observable<Response> {
        return Observable.throw("not implemented");
    }
    
    options(url: string, options?: RequestOptionsArgs): Observable<Response> {
        return Observable.throw("not implemented");
    }

    private convertHeaders(headers: Headers): {[key: string] : string} {
        let converted: {[key: string] : string} = {};
        headers.forEach((val:string[], name:string, _headers: any) => {
            //console.log(`header ${name}`, val);
            headers[name] = val[0];
        });
        return converted;
    }

    private onAccountSelected(account: Account): void {
        console.log(`account selected/scanned: ${account.getKey()}. Has sslCert: `, account.sslCert && account.sslCert.length > 0);
        Https.disableSSLPinning();
        if(account.sslCert) {
            let dir = knownFolders.currentApp().getFolder('certs');
            let hostname = new RegExp(/^https?:\/\/(.*?)(:.*)?$/).exec(account.url)[1];
            let text = `-----BEGIN CERTIFICATE-----\n${account.sslCert}\n-----END CERTIFICATE-----`;
            let file = File.fromPath(`${dir.path}/${hostname}`);
        
            file.writeText(text).then(r => {
                let pinningOptions = { 
                    host: hostname, 
                    certificate: file.path,
                    allowInvalidCertificates: false,
                    validatesDomainName: false
                };
                Https.enableSSLPinning(pinningOptions);
            });
        }
    }

}