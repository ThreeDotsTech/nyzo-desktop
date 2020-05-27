const bip39 = require("bip39")
const { NyzoKey } = require("nyzospace/src/NyzoKey.js")


function generate_mnemonic(bits = 128) {
  const mnemonic = bip39.generateMnemonic(bits)
  return mnemonic
}

function generate_mnemonic24() {
  return generate_mnemonic(256)
}

function deriveKeyPairFromMnemonic(mnemonic, index) {
  const MasterKey = new NyzoKey().fromBIP39(mnemonic.trim())
  let derived = MasterKey.derive(index)
  return derived
}