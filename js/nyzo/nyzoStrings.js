class NyzoStringPrivateSeed {

    constructor(seed) {
        this.seed = seed;
    }

    getSeed() {
        return this.seed;
    }
}

class NyzoStringPublicIdentifier {

    constructor(identifier) {
        this.identifier = identifier;
    }

    getIdentifier() {
        return this.identifier;
    }
}

class NyzoStringPrefilledData {

    constructor(receiverIdentifier, senderData) {
        this.receiverIdentifier = receiverIdentifier;
        this.senderData = senderData;
    }

    getReceiverIdentifier() {
        return this.receiverIdentifier;
    }

    getSenderData() {
        return this.senderData;
    }
}


var characterLookup = ('0123456789' +
    'abcdefghijkmnopqrstuvwxyz' +
    'ABCDEFGHIJKLMNPQRSTUVWXYZ' +
    '-.~_').split('');

var characterToValueMap = [];
for (var i = 0; i < characterLookup.length; i++) {
    characterToValueMap[characterLookup[i]] = i;
}

function arraysAreEqual(array1, array2) {

    var arraysAreEqual;
    if (array1 == null || array2 == null) {
        arraysAreEqual = array1 == null && array2 == null;
    } else {
        arraysAreEqual = array1.length == array2.length;
        for (var i = 0; i < array1.length && arraysAreEqual; i++) {
            if (array1[i] != array2[i]) {
                arraysAreEqual = false;
            }
        }
    }

    return arraysAreEqual;
}

function decode(encodedString) {

    var result = null;

    var prefix = encodedString.substring(0, 4);


    var expandedArray = byteArrayForEncodedString(encodedString);


    var contentLength = expandedArray[3] & 0xff;
    var checksumLength = expandedArray.length - contentLength - 4;


    if (checksumLength >= 4 && checksumLength <= 6) {



        var headerLength = 4;
        var calculatedChecksum = doubleSha256(expandedArray.subarray(0, headerLength +
            contentLength)).subarray(0, checksumLength);
        var providedChecksum = expandedArray.subarray(expandedArray.length - checksumLength, expandedArray.length);

        if (arraysAreEqual(calculatedChecksum, providedChecksum)) {


            var contentBytes = expandedArray.subarray(headerLength, expandedArray.length - checksumLength);


            if (prefix == 'key_') {
                result = new NyzoStringPrivateSeed(contentBytes);
            } else if (prefix == 'id__') {
                result = new NyzoStringPublicIdentifier(contentBytes);
            } else if (prefix == 'pre_') {
                console.log('content bytes: ' + contentBytes);
                result = new NyzoStringPrefilledData(contentBytes.subarray(0, 32),
                    contentBytes.subarray(33, contentBytes.length));
            }
        }
    }

    return result;
}

function byteArrayForEncodedString(encodedString) {

    var arrayLength = (encodedString.length * 6 + 7) / 8;
    var array = new Uint8Array(arrayLength);
    for (var i = 0; i < arrayLength; i++) {

        var leftCharacter = encodedString.charAt(i * 8 / 6);
        var rightCharacter = encodedString.charAt(i * 8 / 6 + 1);

        var leftValue = characterToValueMap[leftCharacter];
        var rightValue = characterToValueMap[rightCharacter];
        var bitOffset = (i * 2) % 6;
        array[i] = ((((leftValue << 6) + rightValue) >> 4 - bitOffset) & 0xff);
    }

    return array;
}

function encodedStringForByteArray(array) {

    var index = 0;
    var bitOffset = 0;
    var encodedString = "";
    while (index < array.length) {


        var leftByte = array[index] & 0xff;
        var rightByte = index < array.length - 1 ? array[index + 1] & 0xff : 0;


        var lookupIndex = (((leftByte << 8) + rightByte) >> (10 - bitOffset)) & 0x3f;
        encodedString += characterLookup[lookupIndex];


        if (bitOffset == 0) {
            bitOffset = 6;
        } else {
            index++;
            bitOffset -= 2;
        }
    }

    return encodedString;
}

function encodeNyzoString(prefix, contentBytes) {

    var prefixBytes = byteArrayForEncodedString(prefix);





    var checksumLength = 4 + (3 - (contentBytes.length + 2) % 3) % 3;
    var expandedLength = 4 + contentBytes.length + checksumLength;




    var expandedArray = new Uint8Array(expandedLength);
    for (var i = 0; i < prefixBytes.length; i++) {
        expandedArray[i] = prefixBytes[i];
    }
    expandedArray[3] = contentBytes.length;
    for (var i = 0; i < contentBytes.length; i++) {
        expandedArray[i + 4] = contentBytes[i];
    }


    var checksum = doubleSha256(expandedArray.subarray(0, 4 + contentBytes.length));
    for (var i = 0; i < checksumLength; i++) {
        expandedArray[expandedArray.length - checksumLength + i] = checksum[i];
    }


    return encodedStringForByteArray(expandedArray);
}

function nyzoStringFromPrivateKey(byteArray) {
    return encodeNyzoString('key_', byteArray);
}

function nyzoStringFromPublicIdentifier(byteArray) {
    return encodeNyzoString('id__', byteArray);
}
