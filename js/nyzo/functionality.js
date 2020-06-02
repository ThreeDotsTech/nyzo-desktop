var recipientIdentifier = '';
var balanceMicronyzos = 0;
var micronyzosToSend = 0;
var senderData = '';

function amountToSendInputOnChange() {

    var valueString = cleanCoinInputValue(document.getElementById('amountToSendInput').value);
    micronyzosToSend = Math.round(valueString * 1000000);
    updateRecipientValueFromMicronyzos();
}

function recipientWillReceiveInputOnChange() {

    var valueString = cleanCoinInputValue(document.getElementById('recipientWillReceiveInput').value);
    var newMicronyzosToSend = Math.ceil(valueString * 400 / 399 * 1000000);
    if (newMicronyzosToSend != 0 || micronyzosToSend != 1) {
        micronyzosToSend = newMicronyzosToSend;
    }
    updateAmountToSendFromMicronyzos();
}

function senderDataInputOnBlur() {
    var input = document.getElementById('senderDataInput');
    var value = input.value.trim();

    var byteArray = stringAsUint8Array(value);
    while (byteArray.length > 32) {
        value = value.substring(0, value.length - 1);
        try {
            byteArray = stringAsUint8Array(value);
        } catch (error) { }
    }

    setSenderDataWithArray(byteArray);
}

function setSenderDataWithArray(byteArray) {
    console.log('setting sender data with ' + byteArray);
    var cleanValue = stringFromArrayWithLength(byteArray, 0, byteArray.length);

    senderData = cleanValue;
    console.log('sender data is ' + senderData);
    var input = document.getElementById('senderDataInput');
    if (cleanValue == '') {
    } else {
        input.value = cleanValue;
    }
}

function specifiedTransactionIsValid() {
    if (!micronyzosToSend > 0) {
        showSendError("Invalid amount");
    }
    if (micronyzosToSend > accounts[splide2.index].balance * 1000000) {
        showSendError("You don't have enough Nyzo in this account");
    }
    return activeKeypair.toSeedHex().length == 64 && recipientIdentifier.length == 64 && micronyzosToSend > 0 &&
        micronyzosToSend <= accounts[splide2.index].balance * 1000000;
}

function fetchPreviousHash(senderPrivateSeed, callback) {

    var message = new NyzoMessage();
    message.setType(PreviousHashRequest7);
    message.sign(hexStringAsUint8Array(senderPrivateSeed));
    message.send(function (result) {
        callback(result);
    });
}

function submitTransaction(timestamp, senderPrivateSeed, previousHashHeight, previousBlockHash, recipientIdentifier,
    micronyzosToSend, senderData, callback) {

    var transaction = new Transaction();
    transaction.setTimestamp(timestamp);
    transaction.setAmount(micronyzosToSend);
    transaction.setRecipientIdentifier(hexStringAsUint8Array(recipientIdentifier));
    transaction.setPreviousHashHeight(previousHashHeight);
    transaction.setPreviousBlockHash(previousBlockHash);
    transaction.setSenderData(senderData);
    transaction.sign(hexStringAsUint8Array(senderPrivateSeed));

    var message = new NyzoMessage();
    message.setType(Transaction5);
    message.setContent(transaction);
    message.sign(hexStringAsUint8Array(senderPrivateSeed));
    message.send(function (result) {
        callback(result);
    });
}

function submitTransactionClick() {

    if (specifiedTransactionIsValid()) {
        fetchPreviousHash(activeKeypair.toSeedHex(), function (result) {
            if (result == null || result.content == null || result.content.height == null ||
                result.content.hash == null) {
                showHoverInfo('There was a problem getting a recent block hash from the server. Your transaction was not ' +
                    'sent, so it is safe to try to send it again.', false);
            } else {
                if (result.content.height > 10000000000) {  /* unsigned; a bad value is actually -1 */
                    showHoverInfo('The recent block hash sent by the server was invalid. Your transaction was not sent, so ' +
                        'it is safe to try to send it again.', false);
                } else {
                    submitTransaction(result.timestamp + 7000, activeKeypair.toSeedHex(), result.content.height, result.content.hash,
                        recipientIdentifier, micronyzosToSend, stringAsUint8Array(senderData),
                        function (result) {
                            if (result.content == null) {
                                showHoverInfo('There was a problem communicating with the server. To protect yourself ' +
                                    'against possible coin theft, please wait to resubmit this transaction. Refer ' +
                                    'to the Nyzo white paper for full details on why this is necessary, how long ' +
                                    'you need to wait, and to understand how Nyzo provides stronger protection ' +
                                    'than other blockchains against this type of potential vulnerability.', false);
                            } else {
                                if (result.content.message.split(' ')[0] == 'This') {
                                    showHoverInfo(result.content.message, false);
                                } else {
                                    showHoverInfo(result.content.message, true);
                                    document.getElementById('recipientIdentifierInput').value = '';
                                    recipientIdentifier = '';
                                    document.getElementById('amountToSendInput').value = '';
                                    micronyzosToSend = 0;
                                    document.getElementById('senderDataInput').value = '';
                                    senderData = '';
                                    document.getElementById('recipientWillReceiveInput').value = '';

                                }
                            }
                        }
                    );
                }
            }
        });
    } else {
        console.log('specified transaction is not valid');
    }
}

function formatSeed(seed) {

    var result = '';
    if (seed.length == 64) {
        for (var i = 0; i < 64; i++) {
            result += seed.charAt(i);

            if (i % 16 == 15 && i < 63) {
                result += '-';
            }
        }
    }

    return result;
}

function cleanCoinInputValue(valueString, forFocus, prependSymbol) {
    var isAllZeros = true;
    var result = '';
    var foundDecimal = false;
    var charactersAfterDecimal = 0;
    for (var i = 0; i < valueString.length; i++) {
        var character = valueString.charAt(i);

        if (foundDecimal) {
            if (character >= '0' && character <= '9' && charactersAfterDecimal < 6) {
                charactersAfterDecimal++;
                result += character;
                if (character != '0') {
                    isAllZeros = false;
                }
            }
        } else {
            if (character == '.') {
                foundDecimal = true;
                result += character;
            } else if (character >= '0' && character <= '9') {
                if (result.length > 0 || character != '0') {
                    result += character;
                }
                if (character != '0') {
                    isAllZeros = false;
                }
            }
        }
    }

    if (result.length > 0 && result.charAt(0) == '.') {
        result = '0' + result;
    }


    if (result.length > 0 && result.charAt(result.length - 1) == '.') {
        result += '0';
    }

    if (isAllZeros) {
        if (forFocus) {
            result = '';
        } else {
            result = '0.0';
        }
    }

    if (prependSymbol) {
        result = result;
    }

    return result;
}

function privateKeyInputOnBlur() {

    var input = document.getElementById('privateKeyInput');
    input.value = input.value.trim();
    if (input.value == '' || input.value == '-') {
        clearPrivateKey();
        hideInvalidPrivateKey();
    } else {
        var privateKey = decode(input.value);
        if (privateKey !== null && typeof privateKey.getSeed === 'function') {
            privateSeedToImport = hexStringFromArrayWithDashes(privateKey.getSeed(), 0, 32);
            hideInvalidPrivateKey();
        } else {
            showInvalidPrivateKey();
        }
    }
}

function showInvalidPrivateKey() {
    var error = document.getElementById('privKeyError');
    var importbtn = document.getElementById('importbtn');
    importbtn.classList.replace('btn', 'disabledBtn');
    error.classList.remove('hidden');
}
function hideInvalidPrivateKey() {
    var error = document.getElementById('privKeyError');
    var importbtn = document.getElementById('importbtn');
    importbtn.classList.replace('disabledBtn', 'btn');
    error.classList.add('hidden');
}

function clearPrivateKey() {
    privateSeedToImport = '';
}

function recipientIdentifierInputOnBlur() {
    var input = document.getElementById('recipientIdentifierInput');
    if (input.value != '') {
        var input2 = document.getElementById('senderDataInput');
        input.value = input.value.trim();
        var recipientIdentifier = decode(input.value);
        if (recipientIdentifier !== null && typeof recipientIdentifier.getIdentifier === 'function') {
            loadRecipientWithIdentifier(hexStringFromArray(recipientIdentifier.getIdentifier(), 0, 32));
            input2.style.display = 'inline-block';
        } else if (recipientIdentifier !== null && typeof recipientIdentifier.getReceiverIdentifier === 'function' &&
            typeof recipientIdentifier.getSenderData === 'function') {
            loadRecipientWithIdentifier(hexStringFromArray(recipientIdentifier.getReceiverIdentifier(), 0, 32));
            setSenderDataWithArray(recipientIdentifier.getSenderData());
            input2.style.display = 'none';
        } else {
            showSendError('Invalid Identifier');
            input2.style.display = 'inline-block';

        }
    }

}

document.getElementById('amountToSendInput').addEventListener('focus', function () {
    this.value = cleanCoinInputValue(this.value, true, true);
}, false);

document.getElementById('amountToSendInput').addEventListener('blur', function () {
    this.type = 'text';
    this.value = cleanCoinInputValue(this.value, false, true);

    updateAmountToSendFromMicronyzos();
    updateRecipientValueFromMicronyzos();
}, false);

document.getElementById('recipientWillReceiveInput').addEventListener('focus', function () {
    this.value = cleanCoinInputValue(this.value, true, true);
}, false);

document.getElementById('recipientWillReceiveInput').addEventListener('blur', function () {
    this.type = 'text';
    this.value = cleanCoinInputValue(this.value, false, true);

    updateAmountToSendFromMicronyzos();
    updateRecipientValueFromMicronyzos();
}, false);

function loadRecipientWithIdentifier(identifier) {

    recipientIdentifier = identifier;
    if (identifier.length == 64) {

        var recipientString = nyzoStringFromPublicIdentifier(hexStringAsUint8Array(identifier));

        if (recipientString == activeKeypair.toNyzoPublicIdentifier()) {
            showSendError('Receiver same as sender');
        }
    }
}

function updateAmountToSendFromMicronyzos() {
    document.getElementById('amountToSendInput').value = (micronyzosToSend / 1000000.0).toFixed(6);
}

function updateRecipientValueFromMicronyzos() {
    var transactionFee = Math.ceil(micronyzosToSend / 400.0);
    var amountAfterFee = micronyzosToSend - transactionFee;

    document.getElementById('recipientWillReceiveInput').value = (amountAfterFee / 1000000.0).toFixed(6);
}


function publicIdForPrivateSeed(key) {

    var keyBytes = new Uint8Array(32);
    for (var i = 0; i < 32; i++) {
        keyBytes[i] = parseInt(key.substring(i * 2, i * 2 + 2), 16);
    }

    var keyPair = nacl.sign.keyPair.fromSeed(keyBytes);
    var publicIdString = '';
    for (var i = 0; i < 32; i++) {
        var byteString = keyPair.publicKey[i].toString(16);
        while (byteString.length < 2) {
            byteString = '0' + byteString;
        }
        publicIdString += byteString;
    }

    return publicIdString;
}






/*

var _URL = window.URL || window.webkitURL;
document.getElementById('file').addEventListener('change', readFile, false);

function readFile(event) {

    file = this.files[0];
    if (file != null && file != '') {
        image = new Image();
        image.onload = function () {
            var context = document.getElementById('canvas').getContext('2d');
            context.drawImage(image, 0, 0);

            var header = '';
            var key = '';
            for (var byteIndex = 0; byteIndex < 48; byteIndex++) {
                var byteValue = 0;
                for (var bitIndex = 0; bitIndex < 8; bitIndex++) {
                    byteValue = byteValue << 1;
                    var x = (byteIndex * 8 + bitIndex) % 64;
                    var y = (byteIndex * 8 + bitIndex) / 64;
                    if (context.getImageData(x, y, 1, 1).data[0] > 0) {
                        byteValue++;
                    }
                }

                if (byteIndex < 16) {
                    header += String.fromCharCode(byteValue);
                } else {
                    var byteString = byteValue.toString(16);
                    while (byteString.length < 2) {
                        byteString = '0' + byteString;
                    }
                    key += byteString;
                }
            }

            if (header == '_nyzoprivatekey_') {


                if (imageTargetIsRecipient) {
                    var keyPair = nacl.sign.keyPair.fromSeed(hexStringAsUint8Array(key));
                    loadRecipientWithIdentifier(hexStringFromArray(keyPair.publicKey, 0, 32));
                } else {

                    walletPrivateSeed = key;


                    setPrivateKeyTitle(true);
                    var keyPair = nacl.sign.keyPair.fromSeed(hexStringAsUint8Array(key));
                    var privateKeyString = nyzoStringFromPrivateKey(keyPair.secretKey.subarray(0, 32));
                    document.getElementById('privateKeyParagraph').innerHTML = privateKeyString;


                    var publicKeyString = nyzoStringFromPublicIdentifier(keyPair.publicKey);
                    setPublicIdentifierTitle(true);
                    document.getElementById('publicIdentifierParagraph').innerHTML = publicKeyString;


                    loadWalletWithIdentifier(hexStringFromArray(keyPair.publicKey, 0, 32));
                }
            } else if (header == '__nyzopublicid__') {
                if (imageTargetIsRecipient) {
                    loadRecipientWithIdentifier(key);
                } else {
                    clearPrivateKey();
                    loadWalletWithIdentifier(key);
                }
            } else {
                alert('Unable to load file. Please check the file and try again.');
            }
        };
        image.src = _URL.createObjectURL(file);



        this.value = '';
    }
}*/
