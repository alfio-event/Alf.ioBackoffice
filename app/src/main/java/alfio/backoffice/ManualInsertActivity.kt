package alfio.backoffice

import android.os.Bundle
import android.support.design.widget.Snackbar
import android.util.Patterns
import android.view.View
import android.widget.TextView
import kotlinx.android.synthetic.main.activity_manual_insert.*
import kotlinx.android.synthetic.main.app_bar.*
import kotlinx.android.synthetic.main.content_manual_insert.*

class ManualInsertActivity : BaseActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_manual_insert);
        setSupportActionBar(toolbar);
        supportActionBar!!.setDisplayHomeAsUpEnabled(true);
        val urlValidator = TextValidator(manualInsertUrl, {Patterns.WEB_URL.matcher(it).matches()}, getString(R.string.message_base_url_mandatory));
        manualInsertUrl.onFocusChangeListener = urlValidator;
        val usernameValidator = TextValidator(manualInsertUsername, {it.isNotBlank()}, getString(R.string.message_username_mandatory));
        manualInsertUsername.onFocusChangeListener = usernameValidator;
        val passwordValidator = TextValidator(manualInsertPassword, {it.isNotBlank()}, getString(R.string.message_password_mandatory));
        manualInsertPassword.onFocusChangeListener = passwordValidator;
        val validators = listOf(urlValidator, usernameValidator, passwordValidator);

        fab.setOnClickListener {
            if(validators.any { !it.isValid() }) {
                Snackbar.make(it, R.string.message_check_fields, Snackbar.LENGTH_LONG).show();
            } else {
                loadAndSelectEvent(manualInsertUrl.text.toString(), manualInsertUsername.text.toString(), manualInsertPassword.text.toString(), {finish();});
            }
        };
    }

}

class TextValidator(val textView: TextView, val validator: (String) -> Boolean, val errorMessage: String) : View.OnFocusChangeListener {

    fun isValid() : Boolean = validator.invoke(textView.text.toString());

    override fun onFocusChange(v: View?, hasFocus: Boolean) {
        if(!hasFocus) {
            textView.error = if(isValid()) null else errorMessage;
        }
    }
}