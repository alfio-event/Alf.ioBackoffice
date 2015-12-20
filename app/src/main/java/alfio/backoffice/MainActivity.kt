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
import alfio.backoffice.task.*
import alfio.backoffice.view.ConfigurationListItem
import alfio.backoffice.view.ConfigurationViewAdapter
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.support.design.widget.AppBarLayout
import android.support.design.widget.CoordinatorLayout
import android.support.design.widget.Snackbar
import android.util.AttributeSet
import android.view.*
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.AdapterView
import android.widget.LinearLayout
import android.widget.RelativeLayout
import android.widget.Toolbar
import com.github.clans.fab.FloatingActionButton
import com.github.clans.fab.FloatingActionMenu
import com.google.gson.reflect.TypeToken
import com.google.zxing.integration.android.IntentIntegrator
import com.google.zxing.integration.android.IntentResult
import kotlinx.android.synthetic.main.activity_main.*
import kotlinx.android.synthetic.main.content_main.*
import org.jetbrains.anko.*
import org.jetbrains.anko.custom.ankoView
import org.jetbrains.anko.custom.customView
import kotlin.properties.Delegates

class MainActivity : BaseActivity() {

    val LOG_TAG: String = "MainActivity";
    private var listAdapter: ConfigurationViewAdapter by Delegates.notNull();


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState);
        //MainActivityUi().setContentView(this);
        setContentView(R.layout.activity_main);
        setSupportActionBar(toolbar);
        floating_menu.setOnClickListener { view -> Snackbar.make(view, "Test", Snackbar.LENGTH_LONG).setAction("Action", null).show() };
        button_scan_qrcode.setOnClickListener { view ->
            floating_menu.close(true);
            scanQRCodeClicked()
        };
        listAdapter = ConfigurationViewAdapter(this, dataService.alfioConfigurations.map { ConfigurationListItem(it) });
        listView.adapter = listAdapter;
        listView.onItemClickListener = AdapterView.OnItemClickListener { parent, view, position, id ->
            val configuration = dataService.alfioConfigurations[position];
            EventDetailLoader(this)
                    .then({
                        startEventDetailActivity(it, configuration);
                    }).execute(EventDetailParam(configuration.url, configuration.eventName));
        }
        Thread.setDefaultUncaughtExceptionHandler({ thread, throwable ->
            throwable.printStackTrace();
            Snackbar.make(listView, "An unexpected error has occurred: ${throwable.message}", Snackbar.LENGTH_LONG).setAction("Action", null).show();
        })
    }

    private fun startEventDetailActivity(eventDetailResult: EventDetailResult, config: AlfioConfiguration) {
        val intent = Intent(baseContext, EventDetailActivity::class.java);
        intent.putExtra("detail", eventDetailResult);
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
            EventListLoader(this, dataService)
                    .onSuccess { listAdapter.notifyDataSetChanged(); }
                    .execute(EventListLoaderCommand(result["baseUrl"]!!, result["username"]!!, result["password"]!!));
        }
    }

    class MapStringStringTypeToken : TypeToken<Map<String, String>>() {}
}


//the following code is not working... maybe am I missing something?

class MainActivityUi: AnkoComponent<MainActivity> {

//    var listAdapter: ConfigurationViewAdapter by Delegates.notNull();

    override fun createView(ui: AnkoContext<MainActivity>): View = with(ui) {
        customView<CoordinatorLayout> {
            layoutParams = CoordinatorLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT);
            fitsSystemWindows = true;
            customView<AppBarLayout> {
                layoutParams = CoordinatorLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT);
                toolbar {
                    layoutParams = Toolbar.LayoutParams(MATCH_PARENT, R.attr.actionBarSize);
                    backgroundColor = R.attr.colorPrimary
                    popupTheme = R.style.AppTheme_PopupOverlay
                }
            }

            mainContent {
                layoutParams = CoordinatorLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT);
                dataService = ui.owner.dataService;
                init();
            }

            customView<FloatingActionMenu> {
                val lParams = CoordinatorLayout.LayoutParams(WRAP_CONTENT, WRAP_CONTENT);
                lParams.bottomMargin = dip(10);
                lParams.leftMargin = dip(10);
                lParams.rightMargin = dip(10);

                layoutParams = lParams;
                layoutMode = RelativeLayout.ALIGN_PARENT_BOTTOM;
                //foregroundGravity = BOTTOM or END;
                animationDelayPerItem = 50;
                backgroundColor = R.color.zxing_transparent;
                menuButtonColorNormal = R.color.colorAccent;
                menuButtonColorPressed = R.color.colorAccentLight;
                menuButtonColorRipple = R.color.colorFloatingActionButtonRipple;

                customView<FloatingActionButton> {
                    layoutParams = ViewGroup.LayoutParams(WRAP_CONTENT, WRAP_CONTENT);
                    setImageResource(R.mipmap.ic_create_white_18dp);
                    colorNormal = R.color.colorAccent;
                    colorPressed = R.color.colorAccentLight;
                    colorRipple = R.color.colorFloatingActionButtonRipple;
                    labelText = "Insert data manually";
                    buttonSize = FloatingActionButton.SIZE_MINI;
                    onClick {
                        view ->
                        Snackbar.make(view, "Test", Snackbar.LENGTH_LONG).setAction("Action", null).show();
                        close(true);
                    }
                }
                customView<FloatingActionButton> {
                    layoutParams = ViewGroup.LayoutParams(WRAP_CONTENT, WRAP_CONTENT);
                    setImageResource(R.mipmap.ic_camera_enhance_white_18dp);
                    colorNormal = R.color.colorAccent;
                    colorPressed = R.color.colorAccentLight;
                    colorRipple = R.color.colorFloatingActionButtonRipple;
                    labelText = "Scan QR-Code";
                    buttonSize = FloatingActionButton.SIZE_MINI;
                    onClick {
                        view ->
                        close(true);
                        ui.owner.scanQRCodeClicked();
                    }
                }
            }
        };
    };
}

class MainActivityContentUi : LinearLayout {

    var dataService : DataService by Delegates.notNull();
    private var listAdapter: ConfigurationViewAdapter by Delegates.notNull();

    public fun init() = AnkoContext.createDelegate(this).apply {
        orientation = LinearLayout.VERTICAL;
        textView {
            if(Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
                setTextAppearance(this.context, android.R.style.TextAppearance_Material_Medium);
            } else {
                setTextAppearance(android.R.style.TextAppearance_Material_Medium);
            }
            textResource = R.string.main_title;
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT);
        }

        textView {
            if(Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
                setTextAppearance(this.context, android.R.style.TextAppearance_Material_Small);
            } else {
                setTextAppearance(android.R.style.TextAppearance_Material_Small);
            }
            textResource = R.string.main_description;
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT);
        }

        space {
            gravity = Gravity.CENTER_HORIZONTAL;
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, dip(20));
        }

        listView {
            layoutParams = LinearLayout.LayoutParams(WRAP_CONTENT, MATCH_PARENT);
            listAdapter = ConfigurationViewAdapter(this.context, dataService.alfioConfigurations.map { ConfigurationListItem(it) });
            adapter = listAdapter;
            onItemClickListener = AdapterView.OnItemClickListener { parent, view, position, id ->
                val configuration = dataService.alfioConfigurations[position];
                EventDetailLoader(context).then({
                    startActivity<CheckInActivity>(Pair("detail", it));
                }).execute(EventDetailParam(configuration.url, configuration.eventName));
            };
        };
    }

    constructor(context: Context?) : super(context);
    constructor(context: Context?, attrs: AttributeSet?) : super(context, attrs);
    constructor(context: Context?, attrs: AttributeSet?, defStyleAttr: Int) : super(context, attrs, defStyleAttr);

}

public inline fun ViewManager.mainContent(init: MainActivityContentUi.() -> Unit) = ankoView({ MainActivityContentUi(it) }, init)
