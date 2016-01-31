package alfio.backoffice

import android.os.Bundle
import android.text.method.LinkMovementMethod
import kotlinx.android.synthetic.main.app_bar.*
import kotlinx.android.synthetic.main.content_about.*

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
    }
}
