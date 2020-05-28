class DisplayableTransaction {

    constructor() {
        this.amount = 0;
        this.isSend = false;
        this.recipientIdentifier = new String();
        this.block = 0;
    }



    setAmount(amount) {
        this.amount = amount;
    }

    setIsSend(isSend) {
        this.isSend = isSend;
    }

    setRecipientIdentifier(recipientIdentifier) {
        this.recipientIdentifier = recipientIdentifier
    }

    setBlock(block) {
        this.block = block;
    }


}