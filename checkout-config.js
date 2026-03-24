/**
 * Lemon Squeezy — enlace del botón "Get full access"
 *
 * 1. Dashboard: https://app.lemonsqueezy.com → Products → tu producto → variant.
 * 2. "Share" / compartir → copia el enlace de checkout (debe contener /checkout/buy/).
 * 3. Pégalo en LEMONSQUEEZY_CHECKOUT_URL (cadena no vacía).
 * 4. En el producto: Settings → Confirmation → "Redirect URL" tras compra exitosa, por ejemplo:
 *      https://TU-USUARIO.github.io/repo/index.html?purchase=success
 *      https://TU-USUARIO.github.io/repo/robotics.html?purchase=success
 *    purchase=success guarda el desbloqueo en localStorage (persiste tras F5). El demo del botón
 *    sin compra real no escribe localStorage: al recargar vuelve el paywall.
 *
 *    Forzar paywall otra vez: abre la página con ?premium_reset=1 (borra la clave y limpia la URL).
 *
 * Overlay en la misma página (opcional): Lemon.js
 * https://docs.lemonsqueezy.com/guides/developer-guide/lemonjs
 */
(function syncPurchaseFromReturnUrl() {
    const KEY = "mathphye_premium_unlocked";
    try {
        const params = new URLSearchParams(window.location.search);
        const pr = params.get("premium_reset");
        if (pr === "1" || pr === "true") {
            localStorage.removeItem(KEY);
            params.delete("premium_reset");
            const q = params.toString();
            window.history.replaceState({}, "", window.location.pathname + (q ? "?" + q : "") + window.location.hash);
            return;
        }
        if (params.get("purchase") === "success") {
            localStorage.setItem(KEY, "true");
            params.delete("purchase");
            const q = params.toString();
            window.history.replaceState({}, "", window.location.pathname + (q ? "?" + q : "") + window.location.hash);
        }
    } catch (e) {
        /* ignore */
    }
})();

/** Cadena vacía = modo demo (alerta simulada). Con URL real = abre checkout en pestaña nueva. */
window.LEMONSQUEEZY_CHECKOUT_URL = "https://mathphye.lemonsqueezy.com/checkout/buy/0bfc9f30-7cdd-4255-bd45-96907f199554";

/**
 * @returns {boolean} true si se abrió checkout (no ejecutar demo)
 */
window.openLemonSqueezyCheckout = function openLemonSqueezyCheckout() {
    const url = (window.LEMONSQUEEZY_CHECKOUT_URL || "").trim();
    if (!url) return false;
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
};
