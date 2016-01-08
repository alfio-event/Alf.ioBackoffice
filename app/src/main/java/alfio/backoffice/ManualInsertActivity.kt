package alfio.backoffice

import android.os.Bundle
import android.support.design.widget.Snackbar
import android.text.Editable
import android.text.TextWatcher
import android.util.Patterns
import android.widget.TextView
import kotlinx.android.synthetic.main.activity_manual_insert.*
import kotlinx.android.synthetic.main.content_manual_insert.*

class ManualInsertActivity : BaseActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_manual_insert);
        setSupportActionBar(toolbar);
        supportActionBar!!.setDisplayHomeAsUpEnabled(true);
        val urlValidator = TextValidator(manualInsertUrl, {Patterns.WEB_URL.matcher(it).matches()}, getString(R.string.message_base_url_mandatory));
        manualInsertUrl.addTextChangedListener(urlValidator);
        val usernameValidator = TextValidator(manualInsertUsername, {it.isNotBlank()}, getString(R.string.message_username_mandatory));
        manualInsertUsername.addTextChangedListener(usernameValidator);
        val passwordValidator = TextValidator(manualInsertUsername, {it.isNotBlank()}, getString(R.string.message_password_mandatory));
        manualInsertPassword.addTextChangedListener(passwordValidator);
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

/**
 * Original version: http://stackoverflow.com/a/11838715
 */
class TextValidator(val textView: TextView, val validator: (String) -> Boolean, val errorMessage: String) : TextWatcher {

    override fun afterTextChanged(s: Editable?) {
        textView.error = if(isValid()) null else errorMessage;
    }

    fun isValid() : Boolean = validator.invoke(textView.text.toString());

    override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {
        //does nothing
    }

    override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
        //does nothing
    }
}