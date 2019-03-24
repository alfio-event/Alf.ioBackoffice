import { isDefined } from "tns-core-modules/utils/types";
import { HttpHeaders } from "@angular/common/http";

export function authorization(apiKey: string, username: string, password: string): HttpHeaders {
    let headers = new HttpHeaders();
    if(isDefined(apiKey)) {
        headers.append("Authorization", `ApiKey ${apiKey}`);
    } else {
        headers.append("Authorization", "Basic " + encodeBase64(`${username}:${password}`));
    }
    return headers;
}

export function encodeBase64(str: string) {
    var padChar = '=';
    var alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var getByte = function (s, i) {
        var cc = s.charCodeAt(i);
        if (cc > 255) {
            throw "INVALID_CHARACTER_ERR: DOM Exception 5";
        }
        return cc;
    };
    var b10, i;
    var b64Chars = [];
    var iMax = str.length - str.length % 3;
    for (i = 0; i < iMax; i += 3) {
        b10 = (getByte(str, i) << 16) |
            (getByte(str, i + 1) << 8) |
            getByte(str, i + 2);
        b64Chars.push(alpha.charAt(b10 >> 18));
        b64Chars.push(alpha.charAt((b10 >> 12) & 0x3F));
        b64Chars.push(alpha.charAt((b10 >> 6) & 0x3f));
        b64Chars.push(alpha.charAt(b10 & 0x3f));
    }
    switch (str.length - iMax) {
        case 1:
            b10 = getByte(str, i) << 16;
            b64Chars.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
                padChar + padChar);
            break;
        case 2:
            b10 = (getByte(str, i) << 16) | (getByte(str, i + 1) << 8);
            b64Chars.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
                alpha.charAt((b10 >> 6) & 0x3F) + padChar);
            break;
    }
    return b64Chars.join('');
}