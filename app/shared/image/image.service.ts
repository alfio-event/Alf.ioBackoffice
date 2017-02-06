import { Injectable } from "@angular/core";
import { Observable } from 'rxjs/Observable';
import { EventConfiguration, ImageContainer } from "../../shared/account/account";
import imageSource = require("image-source");
import fs = require("file-system");
import enums = require("ui/enums");
import {Folder} from "file-system";

@Injectable()
export class ImageService {
    private folder: Folder;

    constructor() {
        this.folder = fs.knownFolders.documents();
    }

    getImage(baseUrl: string, e: EventConfiguration) :Observable<string> {
        let url = baseUrl + e.imageUrl;
        let filename = fs.path.join(this.folder.path, e.imageUrl.replace(/[^A-Za-z0-9]/g,'_'));
        if(fs.File.exists(filename)) {
            return Observable.of(filename);
        } else {
            return Observable.fromPromise(imageSource.fromUrl(url))
                .map(img => {
                    img.saveToFile(filename, enums.ImageFormat.png);
                    return filename;
                });
        }
    } 

}