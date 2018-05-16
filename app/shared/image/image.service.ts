import { Injectable } from "@angular/core";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import { EventConfiguration, ImageContainer, Account } from "../../shared/account/account";
import imageSource = require("image-source");
import fs = require("file-system");
import enums = require("ui/enums");
import { Folder } from "file-system";
import { Http } from "@angular/http";

@Injectable()
export class ImageService {

private piImage = `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`;

    private folder: Folder;

    constructor(private http: Http) {
        this.folder = fs.knownFolders.documents();
    }

    getImage(account: Account, e: EventConfiguration) :Observable<string> {
        let url = account.url + e.imageUrl;
        let filename = fs.path.join(this.folder.path, e.imageUrl.replace(/[^A-Za-z0-9]/g,'_'));
        if(fs.File.exists(filename)) {
            return Observable.of(filename);
        } else if(account.sslCert) {
            let img = imageSource.fromBase64(this.piImage);
            img.saveToFile(filename, "png");
            return Observable.of(filename);
        } else {
             return Observable.fromPromise(imageSource.fromUrl(url))
                .map(img => {
                    img.saveToFile(filename, "png");
                    return filename;
                });
        }
    } 

}