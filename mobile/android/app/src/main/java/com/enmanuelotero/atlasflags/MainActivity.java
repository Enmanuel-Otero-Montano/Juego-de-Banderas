package com.enmanuelotero.atlasflags;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(SecureSessionPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
