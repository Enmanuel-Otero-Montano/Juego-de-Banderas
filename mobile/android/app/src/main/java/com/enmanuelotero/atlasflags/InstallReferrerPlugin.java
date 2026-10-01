package com.enmanuelotero.atlasflags;

import android.net.Uri;

import com.android.installreferrer.api.InstallReferrerClient;
import com.android.installreferrer.api.InstallReferrerStateListener;
import com.android.installreferrer.api.ReferrerDetails;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Reads the opaque room token delivered by Google Play exactly once per app flow. */
@CapacitorPlugin(name = "InstallReferrer")
public class InstallReferrerPlugin extends Plugin {
    private static final String TOKEN_PATTERN = "^[A-Za-z0-9_-]{32,256}$";

    @PluginMethod
    public void getPendingRaceInvite(PluginCall call) {
        InstallReferrerClient client = InstallReferrerClient.newBuilder(getContext()).build();
        client.startConnection(new InstallReferrerStateListener() {
            @Override
            public void onInstallReferrerSetupFinished(int responseCode) {
                try {
                    if (responseCode != InstallReferrerClient.InstallReferrerResponse.OK) {
                        resolve(call, null);
                        return;
                    }
                    ReferrerDetails details = client.getInstallReferrer();
                    String raw = details.getInstallReferrer();
                    String token = Uri.parse("https://local.invalid/?" + raw).getQueryParameter("race_invite");
                    resolve(call, token != null && token.matches(TOKEN_PATTERN) ? token : null);
                } catch (Exception error) {
                    call.reject("No se pudo consultar la invitación de instalación", error);
                } finally {
                    client.endConnection();
                }
            }

            @Override
            public void onInstallReferrerServiceDisconnected() {
                // Google Play may reconnect internally; the manual room code remains the fallback.
            }
        });
    }

    private void resolve(PluginCall call, String token) {
        JSObject result = new JSObject();
        result.put("token", token);
        call.resolve(result);
    }
}
