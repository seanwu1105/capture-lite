package io.numbersprotocol.capturelite;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import com.equimaps.capacitorblobwriter.BlobWriter;

import java.util.ArrayList;
import android.content.res.Configuration;
import android.webkit.WebSettings;

public class MainActivity extends BridgeActivity {
  void setDarkMode() {
    // WORKAROUND: Android device doesn't support media query for prefers-color-scheme
    // @reference: https://github.com/ionic-team/capacitor/discussions/1978#discussioncomment-708439
    int nightModeFlags = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
    WebSettings webSettings = this.bridge.getWebView().getSettings();
    if (nightModeFlags == Configuration.UI_MODE_NIGHT_YES) {
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
        // As of Android 10, you can simply force the dark mode
        webSettings.setForceDark(WebSettings.FORCE_DARK_ON);
      }
    } else {
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
        webSettings.setForceDark(WebSettings.FORCE_DARK_OFF);
      }
    }
  }

  @Override
  public void onStart() {
    super.onStart();
    setDarkMode();
  }

  @Override
  public void onResume() {
    super.onResume();
    setDarkMode();
  }

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Initializes the Bridge
    this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
      // Additional plugins you've installed go here
      add(BlobWriter.class);
    }});
  }
}
