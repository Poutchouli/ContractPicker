# tools/encrypt_config.py
import json, os, getpass, base64, re
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend

INPUT_FILE_PATH = '../js/config.js'
OUTPUT_FILE_PATH = '../js/config.encrypted.json'
SALT_SIZE = 16
ITERATIONS = 390_000

def extract_js_variable(var_name, content):
    pattern = re.compile(f'export const {var_name} = (.*?);', re.DOTALL)
    match = pattern.search(content)
    if match:
        try:
            json_str = match.group(1).strip()
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"  -> AVERTISSEMENT: Erreur de parsing pour '{var_name}': {e}")
            return None
    return None

def encrypt_config():
    print("--- Outil de Chiffrement de la Configuration ---")
    try:
        with open(INPUT_FILE_PATH, 'r', encoding='utf-8') as f:
            js_content = f.read()
        
        data_to_encrypt = {
            "MODELES_COPIEURS": extract_js_variable("MODELES_COPIEURS_DEFAUT", js_content),
            "MEMOS_EXPERTS": extract_js_variable("MEMOS_EXPERTS", js_content),
            "CONTRATS_TYPES": extract_js_variable("CONTRATS_TYPES", js_content),
            "QUESTIONNAIRES": extract_js_variable("QUESTIONNAIRES", js_content),
            "NOMS_SIMULES": extract_js_variable("NOMS_SIMULES", js_content),
            "ANALYSE_TEMPLATES": extract_js_variable("ANALYSE_TEMPLATES", js_content)
        }
        
        if not data_to_encrypt["MODELES_COPIEURS"]:
            print(f"ERREUR: Impossible d'extraire les données de {INPUT_FILE_PATH}")
            return
        print(f"✅ Données extraites de {INPUT_FILE_PATH} avec succès.")
    except FileNotFoundError:
        print(f"ERREUR: Le fichier source '{INPUT_FILE_PATH}' n'a pas été trouvé.")
        return

    password = getpass.getpass("Entrez le mot de passe pour le chiffrement: ")
    if not password:
        print("Opération annulée.")
        return

    salt = os.urandom(SALT_SIZE)
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITERATIONS, backend=default_backend())
    key = kdf.derive(password.encode('utf-8'))
    print("🔑 Clé de chiffrement dérivée.")

    iv = os.urandom(12)
    encryptor = Cipher(algorithms.AES(key), modes.GCM(iv), backend=default_backend()).encryptor()
    plaintext_bytes = json.dumps(data_to_encrypt).encode('utf-8')
    ciphertext = encryptor.update(plaintext_bytes) + encryptor.finalize()
    tag = encryptor.tag
    print("🔒 Données chiffrées avec AES-256-GCM.")

    final_data = {
        'salt': base64.b64encode(salt).decode('utf-8'),
        'iv': base64.b64encode(iv).decode('utf-8'),
        'tag': base64.b64encode(tag).decode('utf-8'),
        'ciphertext': base64.b64encode(ciphertext).decode('utf-8')
    }
    
    with open(OUTPUT_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2)
        
    print(f"🎉 Fichier de configuration chiffré sauvegardé dans : {OUTPUT_FILE_PATH}")

if __name__ == '__main__':
    encrypt_config()
