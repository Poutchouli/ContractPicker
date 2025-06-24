// js/crypto.js
export const CryptoManager = (() => {
    const b64decode = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const deriveKey = async (password, salt) => {
        const passwordKey = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
        return await window.crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, passwordKey, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
    };
    const decryptAndLoadConfig = async () => {
        try {
            const response = await fetch('js/config.encrypted.json');
            if (!response.ok) return null;
            const encryptedData = await response.json();
            const password = prompt("Veuillez entrer le mot de passe pour charger la configuration sécurisée :");
            if (!password) { alert("Opération annulée."); return null; }
            const salt = b64decode(encryptedData.salt);
            const iv = b64decode(encryptedData.iv);
            const tag = b64decode(encryptedData.tag);
            const ciphertext = b64decode(encryptedData.ciphertext);
            const key = await deriveKey(password, salt);
            const fullCiphertext = new Uint8Array(ciphertext.length + tag.length);
            fullCiphertext.set(ciphertext);
            fullCiphertext.set(tag, ciphertext.length);
            const decrypted_payload = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, fullCiphertext);
            return JSON.parse(new TextDecoder().decode(decrypted_payload));
        } catch (error) {
            console.error("Erreur de déchiffrement:", error);
            alert("Échec du déchiffrement. Le mot de passe est-il correct ou le fichier de configuration est-il valide ?");
            return null;
        }
    };
    return { decryptAndLoadConfig };
})();
