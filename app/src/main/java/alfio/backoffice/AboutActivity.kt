/**
 * This file is part of alf.io backoffice.

 * alf.io backoffice is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * alf.io backoffice is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with alf.io backoffice.  If not, see //www.gnu.org/licenses/>.
 */
package alfio.backoffice

import android.os.Bundle
import android.text.Html
import android.text.method.LinkMovementMethod
import android.util.Xml
import kotlinx.android.synthetic.main.app_bar.*
import kotlinx.android.synthetic.main.content_about.*
import org.xmlpull.v1.XmlPullParser

class AboutActivity : BaseActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_about);
        setSupportActionBar(toolbar);
        supportActionBar!!.setDisplayHomeAsUpEnabled(true);
        val appName = getString(R.string.app_name);
        val version = packageManager.getPackageInfo(packageName, 0).versionName;
        license.movementMethod = LinkMovementMethod.getInstance();
        appVersion.text = "$appName v.$version";
        val parser = Xml.newPullParser();
        parser.setFeature(XmlPullParser.FEATURE_PROCESS_NAMESPACES, false);
        parser.setInput(resources.assets.open("dependency-license.xml"), null);
        parser.nextTag();
        parser.require(XmlPullParser.START_TAG, null, "dependencies");
        thirdparty.text = Html.fromHtml(getElementsByTagName("dependency")(parser)
                .filter { it.url != null }
                .joinToString(separator = "<br/><br/>", transform = {"${it.file}:<br/><a href=\"${it.url}\">${it.license}</a>"}));
        thirdparty.movementMethod = LinkMovementMethod.getInstance();
    }

    fun getElementsByTagName(name: String) : (XmlPullParser) -> MutableList<Item> {
        return {
            it.nextTag();
            it.require(XmlPullParser.START_TAG, null, name);
            val result: MutableList<Item> = arrayListOf();
            while(it.next() != XmlPullParser.END_DOCUMENT) {
                if (it.eventType == XmlPullParser.START_TAG && it.name.equals("dependency")) {
                    result.add(readElement(it));
                }
            }
            result;
        };
    }

    fun readElement(parser: XmlPullParser) : Item {
        parser.nextTag();
        val fileName = parser.nextText();
        parser.nextTag();
        val license = parser.getAttributeValue(0);
        val url = if(parser.attributeCount > 1) parser.getAttributeValue(1) else null;
        return Item(fileName, license, url);
    }
}

data class Item(val file: String, val license: String, val url: String?);
