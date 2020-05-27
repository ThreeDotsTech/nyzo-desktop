
class Wallet {
    constructor() {
        this.mnemonic = new String();
        this.publicKeyCount = 1;
        this.externalPrivateKeys = [];
    }

    setMnemonic(mnemonic) {
        this.mnemonic = mnemonic;
    }

    increasePublicKeyCount() {
        this.publicKeyCount += 1;
        return this.derivePublicKey(this.publicKeyCount - 1);
    }

    getMasterKey() {
        const { NyzoKey } = require("nyzospace/src/NyzoKey.js");
        const MasterKey = new NyzoKey().fromBIP39(this.mnemonic);
        return MasterKey;
    }

    derivePublicKey(index) {
        const MasterKey = this.getMasterKey();
        let pubkey = MasterKey.derive(index).toPubKeyHexWithDashes();
        return pubkey;
    }

    getDerivedPublicKeys() {
        let publicKeys = [];
        for (let index = 0; index < this.publicKeyCount; index++) {
            publicKeys.push(this.derivePublicKey(index));
        }
        return publicKeys;
    }

    getExternalPublickKeys() {
        const { NyzoKey } = require("nyzospace/src/NyzoKey.js");
        let publicKeys = [];
        for (const eachPrivateKey of this.externalPrivateKeys) {
            let externalKeyPair = new NyzoKey(eachPrivateKey);
            publicKeys.push(externalKeyPair.toPubKeyHexWithDashes());
        }
        return publicKeys;
    }

    getAllPublicKeys() {
        let publicKeys = [];
        publicKeys = publicKeys.concat(this.getDerivedPublicKeys());
        publicKeys = publicKeys.concat(this.getExternalPublickKeys());
        return publicKeys;
    }

    getPrivateKeyOfDeriveIndex(index) {
        const MasterKey = this.getMasterKey();
        let privateKey = MasterKey.derive(index).toSeedHexWithDashes();
        return privateKey;
    }

    getPrivateKeyOf(publicKey) {
        let derivedPublicKeys = this.getDerivedPublicKeys();
        let indexOfDerivedPublicKey = derivedPublicKeys.indexOf(publicKey);
        if (indexOfDerivedPublicKey != -1) {
            return this.getPrivateKeyOfDeriveIndex(indexOfDerivedPublicKey);
        }
        let externalPublicKeys = this.getExternalPublickKeys();
        let indexOfExternalPublicKey = externalPublicKeys.indexOf(publicKey);
        return this.externalPrivateKeys[indexOfExternalPublicKey]

    }

    addExternalKey(externalPrivateKey) {
        function checkPrivateKey(eachPrivateKey) {
            return externalPrivateKey == eachPrivateKey
        }
        let indexOfExistingPrivateKey = this.externalPrivateKeys.findIndex(checkPrivateKey);
        if (indexOfExistingPrivateKey == -1) {
            this.externalPrivateKeys.push(externalPrivateKey);
            return this.getExternalPublickKeys()[this.externalPrivateKeys.length - 1];
        }
        return false;

    }

    removeExternalKey(externalPrivateKey) {
        function checkPrivateKey(eachPrivateKey) {
            return externalPrivateKey == eachPrivateKey
        }
        let indexToRemove = this.externalPrivateKeys.findIndex(checkPrivateKey);
        this.externalPrivateKeys.splice(indexToRemove, 1);
    }
}