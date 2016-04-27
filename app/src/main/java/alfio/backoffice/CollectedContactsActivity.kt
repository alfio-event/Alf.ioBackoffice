package alfio.backoffice

import alfio.backoffice.data.SponsorScanDescriptor
import alfio.backoffice.data.SponsorScanManager
import alfio.backoffice.model.AlfioConfiguration
import alfio.backoffice.view.AttendeesViewAdapter
import android.content.Intent
import android.os.Bundle
import android.support.v4.app.NavUtils
import android.support.v4.app.TaskStackBuilder
import android.support.v7.widget.LinearLayoutManager
import android.view.MenuItem
import kotlinx.android.synthetic.main.app_bar.*
import kotlinx.android.synthetic.main.content_collected_contacts.*
import java.text.SimpleDateFormat
import java.util.*

class CollectedContactsActivity : BaseActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_collected_contacts);
        setSupportActionBar(toolbar);
        supportActionBar!!.setDisplayHomeAsUpEnabled(true);
        val config = intent.extras.get("config") as AlfioConfiguration;
        attendees.adapter = AttendeesViewAdapter(loadScanDescriptors(config));
        attendees.layoutManager = LinearLayoutManager(this);
        shuffle.setOnClickListener({w -> attendees.adapter = AttendeesViewAdapter(loadScanDescriptors(config, true))});
        sendEmail.setOnClickListener({w ->
            val intent = Intent(Intent.ACTION_SEND);
            val export = loadScanDescriptors(config)
                    .map { it.code }
                    .joinToString(separator = "\n");
            intent.putExtra(Intent.EXTRA_TEXT, export);
            intent.putExtra(Intent.EXTRA_SUBJECT, "Scan export for ${config.event.name} (${config.eventName})");
            intent.type = "text/plain";
            startActivity(Intent.createChooser(intent, "Scan export for ${config.eventName}"));
        });
        val updateDate = SponsorScanManager.latestUpdate;
        val date = if(updateDate != null) SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(updateDate) else "-"
        lastUpdate.text = getString(R.string.collected_item_last_update).format(date);
    }

    fun loadScanDescriptors(configuration: AlfioConfiguration, shuffle: Boolean = false) : List<SponsorScanDescriptor> {
        val result = SponsorScanManager.retrieveAllSponsorScan()
                .filter { it.configuration!!.equals(configuration) };
        if(shuffle) {
            Collections.shuffle(result);
        }
        return result;
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        when(item.itemId) {
            android.R.id.home -> {
                val intent = NavUtils.getParentActivityIntent(this);
                intent.putExtras(this.intent.extras);
                if(NavUtils.shouldUpRecreateTask(this, intent)) {
                    TaskStackBuilder.create(this)
                        .addNextIntentWithParentStack(intent)
                        .startActivities();
                } else {
                    NavUtils.navigateUpTo(this, intent);
                }
                return true;
            }
        }
        return super.onOptionsItemSelected(item);
    }
}