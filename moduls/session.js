/**
 * Decodifica un JWT (payload) para leer su fecha de expiración.
 * Retorna null si el formato es inválido.
 */
function decodeToken(token) {
    try {
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) return null;

        // A veces la cadena Base64Url necesita ajustes para ser Base64 estándar
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (err) {
        console.error('Error al decodificar token:', err);
        return null;
    }
}

/**
 * Verifica si el token no existe, es inválido o está expirado.
 */
export function isTokenExpired(token) {
    if (!token) return true;

    const payload = decodeToken(token);
    if (!payload || !payload.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    // exp es el timestamp de expiración (unix seconds)
    return payload.exp < now;
}

/**
 * Limpia toda la info de sesión del almacenamiento local y de sesión.
 */
export function clearSession() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('name');
    localStorage.removeItem('user_id');
    localStorage.removeItem('profile_image_url');
    sessionStorage.removeItem('accessToken');
}

/**
 * Devuelve el token si es válido.
 * Si está expirado, limpia la sesión y devuelve null.
 */
export function getValidToken() {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

    if (isTokenExpired(token)) {
        // Si existía pero expiró, limpiamos para no confundir al usuario
        if (token) {
            clearSession();
        }
        return null;
    }

    return token;
}
