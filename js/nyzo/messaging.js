class TransactionResponse {

    constructor(transactionAccepted, message) {
        this.transactionAccepted = transactionAccepted;
        this.message = message;
    }

    getBytes(includeSignatureIgnored) {
        var buffer = new ByteBuffer(1000);

        buffer.putByte(this.transactionAccepted);

        var messageBytes = stringAsUint8Array(this.message)
        buffer.putShort(messageBytes.length);
        buffer.putBytes(messageBytes);

        return buffer.toArray();
    }
}

class PreviousHashResponse {

    constructor(height, hash) {
        this.height = height;
        this.hash = hash;
    }

    getBytes(includeSignatureIgnored) {

        var buffer = new ByteBuffer(1000);

        buffer.putLong(this.height);
        buffer.putBytes(this.hash);

        return buffer.toArray();
    }
}

class NyzoMessage {

    constructor() {
        this.timestamp = Date.now();
        this.sourceNodeIdentifier = new Uint8Array(32);
        this.type = 0;
        this.content = null;
        this.sourceNodeSignature = new Uint8Array(64);
    }

    setSourceNodeIdentifier(newSourceNodeIdentifier) {
        this.sourceNodeIdentifier = newSourceNodeIdentifier;
        return this;
    }

    setType(newType) {
        this.type = newType;
        return this;
    }

    setContent(newContent) {
        this.content = newContent;
    }

    getBytes(includeSignature) {
        var byteBuffer = new ByteBuffer(1000);

        var contentBytes = null;
        var contentSize = 110;
        if (this.content != null) {
            contentBytes = this.content.getBytes(true);
            contentSize += contentBytes.length;
        }

        if (includeSignature) {
            byteBuffer.putInt(contentSize);
        }

        byteBuffer.putLong(this.timestamp);
        byteBuffer.putShort(this.type);
        if (contentBytes != null) {
            byteBuffer.putBytes(contentBytes);
        }
        byteBuffer.putBytes(this.sourceNodeIdentifier);

        if (includeSignature) {
            byteBuffer.putBytes(this.sourceNodeSignature);
        }

        var byteArray = byteBuffer.toArray();
        console.log('message byte buffer is ' + hexStringFromArrayWithDashes(byteArray, 0, byteArray.length));

        return byteBuffer.toArray();
    }

    sign(seedBytes) {
        var keyPair = nacl.sign.keyPair.fromSeed(seedBytes);
        for (var i = 0; i < 32; i++) {
            this.sourceNodeIdentifier[i] = keyPair.publicKey[i];
        }

        var signature = nacl.sign.detached(this.getBytes(false), keyPair.secretKey);
        for (var i = 0; i < 64; i++) {
            this.sourceNodeSignature[i] = signature[i];
        }
    }

    verify() {
        var messageBytes = this.getBytes(false);
        console.log('message to verify ' + hexStringFromArrayWithDashes(messageBytes, 0, messageBytes.length));
        console.log('signature to verify ' + hexStringFromArrayWithDashes(this.signature, 0, this.signature.length));
        var signatureIsValid = nacl.sign.detached.verify(this.getBytes(false), this.signature,
            this.sourceNodeIdentifier);

        return signatureIsValid;
    }

    fromByteBuffer(byteBuffer) {

    }

    send(callback) {
        var request = new XMLHttpRequest();
        request.open("POST", "https://nyzo.co/message", true);
        request.setRequestHeader("Content-type", "application/octet-stream");
        request.contentType = "application/octet-stream";
        request.responseType = "arraybuffer";

        request.onload = function (oEvent) {
            var arrayBuffer = request.response;
            if (arrayBuffer) {
                var byteArray = new Uint8Array(arrayBuffer);
                console.log('byte array response is ' + hexStringFromArrayWithDashes(byteArray, 0, byteArray.length));
                var response = new NyzoMessage();

                response.timestamp = intValueFromArray(byteArray, 4, 8);
                response.type = intValueFromArray(byteArray, 12, 2);
                console.log('message type is ' + response.type);
                response.content = contentForType(response.type, byteArray, 14);
                var sourceNodeIdentifierIndex = 14 + contentSizeForType(response.type, byteArray, 14);
                response.sourceNodeIdentifier = arrayFromArray(byteArray, sourceNodeIdentifierIndex, 32);
                response.signature = arrayFromArray(byteArray, sourceNodeIdentifierIndex + 32, 64);

                console.log('signature is valid ' + response.verify());
                callback(response);

                console.log('got response with timestamp ' + response.timestamp);
                console.log('response signature is ' + hexStringFromArrayWithDashes(response.signature, 0, 64));
            }
        };

        request.send(this.getBytes(true));
    }

}

function contentForType(messageType, byteArray, index) {

    console.log('getting content for type ' + messageType + ' from index ' + index);

    var result = null;
    if (messageType == TransactionResponse6) {
        var transactionAccepted = byteArray[index];
        var message = stringFromArray(byteArray, index + 1);
        result = new TransactionResponse(transactionAccepted, message);
    } else if (messageType == PreviousHashResponse8) {
        var height = intValueFromArray(byteArray, index, 8);
        var hash = arrayFromArray(byteArray, index + 8, 32);
        result = new PreviousHashResponse(height, hash);
    }

    return result;
}

function contentSizeForType(messageType, byteArray, index) {

    var contentSize = 0;
    if (messageType == TransactionResponse6) {
        contentSize = 3 + intValueFromArray(byteArray, index + 1, 2);
    } else if (messageType == PreviousHashResponse8) {
        contentSize = 8 + 32;
    }

    console.log('content size is ' + contentSize + ' for message type ' + messageType);

    return contentSize;
}