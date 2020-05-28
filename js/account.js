class Account {
    constructor() {
        this.name = new String();
        this.publicIdentifier = new String();
        this.balance = 0;
        this.transactions = [];
    }
    setName(name) {
        this.name = name;
    }
    setPublicIdentifier(publicIdentifier) {
        this.publicIdentifier = publicIdentifier;
    }
    setBalance(balance) {
        this.balance = balance;
    }
    setTransactions(transactions) {
        this.transactions = transactions;
    }
}