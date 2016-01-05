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

import alfio.backoffice.model.AlfioConfiguration
import alfio.backoffice.service.DataService
import alfio.backoffice.task.EventListLoader
import alfio.backoffice.task.EventListLoaderCommand
import alfio.backoffice.task.EventListLoaderResult
import alfio.backoffice.view.ConfigurationViewAdapter
import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.support.design.widget.Snackbar
import android.support.v7.widget.LinearLayoutManager
import android.view.Menu
import android.view.MenuItem
import com.google.gson.reflect.TypeToken
import com.google.zxing.integration.android.IntentIntegrator
import com.google.zxing.integration.android.IntentResult
import kotlinx.android.synthetic.main.activity_main.*
import kotlinx.android.synthetic.main.content_main.*
import kotlin.properties.Delegates

class MainActivity : BaseActivity() {

    private var listAdapter: ConfigurationViewAdapter by Delegates.notNull();


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        setSupportActionBar(toolbar);
        button_scan_qrcode.setOnClickListener { view ->
            floating_menu.close(true);
            scanQRCodeClicked();
        };
        listAdapter = ConfigurationViewAdapter({configuration -> startEventDetailActivity(configuration)});
        listView.adapter = listAdapter;
        listView.layoutManager = LinearLayoutManager(this);
        Thread.setDefaultUncaughtExceptionHandler({ thread, throwable ->
            throwable.printStackTrace();
            Snackbar.make(listView, "An unexpected error has occurred: ${throwable.message}", Snackbar.LENGTH_LONG).setAction("Action", null).show();
        })
    }

    private fun startEventDetailActivity(config: AlfioConfiguration) {
        val intent = Intent(baseContext, EventDetailActivity::class.java);
        intent.putExtra("config", config);
        startActivity(intent);
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        // Inflate the menu; this adds items to the action bar if it is present.
        menuInflater.inflate(R.menu.menu_main, menu);
        return true;
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        val id = item.itemId;

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            return true;
        }

        return super.onOptionsItemSelected(item)
    }

    fun scanQRCodeClicked(): Unit {
        requestPermissionForAction(listOf(android.Manifest.permission.CAMERA), scanQRCode(R.string.message_scan_your_qrcode));
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, intent: Intent?) {
        val scanResult : IntentResult? = IntentIntegrator.parseActivityResult(requestCode, resultCode, intent);
        if(scanResult != null && scanResult.contents != null) {
            val result: Map<String, String> = Common.gson.fromJson(scanResult.contents, MapStringStringTypeToken().type);
            val resultHandler: (EventListLoaderResult, Int) -> Unit = {
                resp, which ->
                val event = resp.results[which];
                val configuration = AlfioConfiguration(resp.param!!.baseUrl, resp.param.username, resp.param.password, resp.userType, event);
                DataService.saveAlfioConfiguration(configuration);
                listAdapter.notifyInsertion();
            };
            EventListLoader(this)
                    .then({
                        when(it.results.size) {
                            1 -> resultHandler(it, 0);
                            else -> AlertDialog.Builder(this)
                                    .setTitle(R.string.dialog_select_event_title)
                                    .setItems(it.results.map { it.name }.toTypedArray(), {
                                        dialog, which ->
                                        resultHandler(it, which);
                                    })
                                    .show();
                        }
                    })
                    .execute(EventListLoaderCommand(result["baseUrl"]!!, result["username"]!!, result["password"]!!));
        }
    }

    class MapStringStringTypeToken : TypeToken<Map<String, String>>() {}
}