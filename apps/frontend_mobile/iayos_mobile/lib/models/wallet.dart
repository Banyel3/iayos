class WalletDepositRequest {
  final double amount;
  final String paymentMethod;

  WalletDepositRequest({required this.amount, this.paymentMethod = 'GCASH'});

  Map<String, dynamic> toJson() {
    return {'amount': amount, 'payment_method': paymentMethod};
  }
}

class WalletDepositResponse {
  final bool success;
  final int transactionId;
  final String paymentUrl;
  final String invoiceId;
  final double amount;
  final double newBalance;
  final String expiryDate;
  final String message;
  final String? error;

  WalletDepositResponse({
    required this.success,
    this.transactionId = 0,
    this.paymentUrl = '',
    this.invoiceId = '',
    this.amount = 0.0,
    this.newBalance = 0.0,
    this.expiryDate = '',
    this.message = '',
    this.error,
  });

  factory WalletDepositResponse.fromJson(Map<String, dynamic> json) {
    return WalletDepositResponse(
      success: json['success'] ?? false,
      transactionId: json['transaction_id'] ?? 0,
      paymentUrl: json['payment_url'] ?? '',
      invoiceId: json['invoice_id'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      newBalance: (json['new_balance'] ?? 0).toDouble(),
      expiryDate: json['expiry_date'] ?? '',
      message: json['message'] ?? '',
      error: json['error'],
    );
  }

  factory WalletDepositResponse.error(String errorMessage) {
    return WalletDepositResponse(success: false, error: errorMessage);
  }
}

class Transaction {
  final int transactionId;
  final String transactionType;
  final double amount;
  final double balanceAfter;
  final String status;
  final String description;
  final String paymentMethod;
  final String? invoiceUrl;
  final DateTime createdAt;
  final DateTime? completedAt;

  Transaction({
    required this.transactionId,
    required this.transactionType,
    required this.amount,
    required this.balanceAfter,
    required this.status,
    required this.description,
    required this.paymentMethod,
    this.invoiceUrl,
    required this.createdAt,
    this.completedAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      transactionId: json['transactionID'] ?? 0,
      transactionType: json['transactionType'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      balanceAfter: (json['balanceAfter'] ?? 0).toDouble(),
      status: json['status'] ?? '',
      description: json['description'] ?? '',
      paymentMethod: json['paymentMethod'] ?? '',
      invoiceUrl: json['invoiceURL'],
      createdAt: DateTime.parse(
        json['createdAt'] ?? DateTime.now().toIso8601String(),
      ),
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'])
          : null,
    );
  }
}
