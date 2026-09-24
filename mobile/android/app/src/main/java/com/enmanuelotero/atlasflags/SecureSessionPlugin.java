package com.enmanuelotero.atlasflags;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Guarda exclusivamente la sesión de ranking fuera del WebView. */
@CapacitorPlugin(name = "SecureSession")
public class SecureSessionPlugin extends Plugin {
    private static final String PREFERENCES = "atlas_flags_secure_session";
    private static final String VALUE_KEY = "ranking_session";
    private static final String KEY_ALIAS = "atlas_flags_session_key_v1";

    private SharedPreferences preferences() {
        return getContext().getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
    }

    private SecretKey key() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) {
            return ((KeyStore.SecretKeyEntry) keyStore.getEntry(KEY_ALIAS, null)).getSecretKey();
        }
        KeyGenerator keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        keyGenerator.init(new KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
        ).setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build());
        return keyGenerator.generateKey();
    }

    private String encrypt(String value) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key());
        String iv = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP);
        String ciphertext = Base64.encodeToString(cipher.doFinal(value.getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP);
        return iv + "." + ciphertext;
    }

    private String decrypt(String value) throws Exception {
        String[] pieces = value.split("\\.", 2);
        if (pieces.length != 2) throw new IllegalArgumentException("Formato cifrado inválido");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, Base64.decode(pieces[0], Base64.NO_WRAP)));
        return new String(cipher.doFinal(Base64.decode(pieces[1], Base64.NO_WRAP)), StandardCharsets.UTF_8);
    }

    @PluginMethod
    public void get(PluginCall call) {
        try {
            JSObject result = new JSObject();
            String encrypted = preferences().getString(VALUE_KEY, null);
            result.put("value", encrypted == null ? null : decrypt(encrypted));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("No se pudo leer la sesión segura", error);
        }
    }

    @PluginMethod
    public void set(PluginCall call) {
        String value = call.getString("value");
        if (value == null) {
            call.reject("Falta el valor de sesión");
            return;
        }
        try {
            preferences().edit().putString(VALUE_KEY, encrypt(value)).apply();
            call.resolve();
        } catch (Exception error) {
            call.reject("No se pudo guardar la sesión segura", error);
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        try {
            preferences().edit().remove(VALUE_KEY).apply();
            call.resolve();
        } catch (Exception error) {
            call.reject("No se pudo borrar la sesión segura", error);
        }
    }
}
