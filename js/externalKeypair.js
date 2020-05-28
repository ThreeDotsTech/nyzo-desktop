class ExternalKeyPair {
    constructor() {
        this.encryptedPrivateKey = String();
        this.publicKey = String();
    }

    setEncryptedPrivateKey(encryptedPrivateKey) {
        this.encryptedPrivateKey = encryptedPrivateKey;
    }

    setPublicKey(publicKey) {
        this.publicKey = publicKey;
    }
}