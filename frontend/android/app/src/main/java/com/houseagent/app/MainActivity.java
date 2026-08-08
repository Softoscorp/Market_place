package com.houseagent.app;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Block screenshots / screen recording / screen-sharing of the app.
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
        // Force device-width layout so the app never renders at a tablet/desktop
        // (wide 980px) viewport on a phone. This also keeps the mobile bottom
        // tab bar visible (it only shows below 768px).
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setUseWideViewPort(false);
            getBridge().getWebView().getSettings().setLoadWithOverviewMode(false);
        }
    }
}
