#  Nyzo Desktop Wallet

Nyzo Desktop Wallet is a  **cross platform** light wallet for the **Nyzo** Cryptocurrency. It works on **Windows**, **MacOS** and **Linux**.


![Nyzo Wallet](https://i.ibb.co/4JKQPJ9/Screen-Shot-2020-05-27-at-21-33-43.png)

# Features


### HD Wallet
Create an unlimited amount of addresses from a single seed.

### All your nyzo in one place

You can import keypairs which were not derived from the HD Wallet.

### Wallet Encryption
Your Mnemonic Seed and Imported Keys are stored and encrypted in a single file. The location of this file depends on the host system:

 -   `%APPDATA%/nyzo-desktop/wallet.nyzowallet`  on Windows
-   `$XDG_CONFIG_HOME/nyzo-desktop/wallet.nyzowallet`  or  `~/.config/nyzo-desktop/wallet.nyzowallet`  on Linux
-   `~/Library/Application Support/nyzo-desktop/wallet.nyzowallet`  on macOS

### Your keys never leave your computer

All the transactions are signed locally and.

### Notifications

Get a notification when you receive Nyzo.


## Requirements: 

```
NodeJS
```
## Compile
To build the application for your OS run:
```
npm install
npm run make
```
