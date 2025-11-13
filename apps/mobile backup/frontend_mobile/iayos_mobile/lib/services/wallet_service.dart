import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/wallet.dart';
import 'api_config.dart';

class WalletService {
  final _storage = const FlutterSecureStorage();

  /// Deposit funds to wallet via Xendit (GCash)
  ///
  /// In TEST MODE: Funds are added immediately to wallet
  /// Returns payment URL to show user the Xendit payment page for UX
  Future<WalletDepositResponse> depositFunds(
    WalletDepositRequest request,
  ) async {
    try {
      print('💰 Depositing ₱${request.amount} to wallet...');

      final token = await _storage.read(key: 'access_token');
      if (token == null) {
        print('❌ No access token found');
        return WalletDepositResponse.error('Not authenticated');
      }

      final response = await http
          .post(
            Uri.parse('${ApiConfig.baseUrl}/api/mobile/wallet/deposit'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: jsonEncode(request.toJson()),
          )
          .timeout(const Duration(seconds: 30));

      print('📡 Deposit response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Deposit successful: ${data['message']}');
        return WalletDepositResponse.fromJson(data);
      } else {
        final error = jsonDecode(response.body);
        print('❌ Deposit failed: ${error['error']}');
        return WalletDepositResponse.error(
          error['error'] ?? 'Failed to deposit funds',
        );
      }
    } catch (e) {
      print('❌ Error depositing funds: $e');
      return WalletDepositResponse.error('Network error: ${e.toString()}');
    }
  }

  /// Get wallet transactions history
  Future<List<Transaction>> getTransactions() async {
    try {
      print('📜 Fetching transactions...');

      final token = await _storage.read(key: 'access_token');
      if (token == null) {
        print('❌ No access token found');
        return [];
      }

      final response = await http
          .get(
            Uri.parse('${ApiConfig.baseUrl}/api/mobile/wallet/transactions'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 30));

      print('📡 Transactions response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List transactionsList = data['transactions'] ?? [];
        print('✅ Found ${transactionsList.length} transactions');

        return transactionsList
            .map((json) => Transaction.fromJson(json))
            .toList();
      } else {
        print('❌ Failed to fetch transactions');
        return [];
      }
    } catch (e) {
      print('❌ Error fetching transactions: $e');
      return [];
    }
  }

  /// Get current wallet balance
  Future<double?> getBalance() async {
    try {
      print('💵 Fetching wallet balance...');

      final token = await _storage.read(key: 'access_token');
      if (token == null) {
        print('❌ No access token found');
        return null;
      }

      final response = await http
          .get(
            Uri.parse('${ApiConfig.baseUrl}/api/mobile/wallet/balance'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 30));

      print('📡 Balance response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final balance = (data['balance'] ?? 0).toDouble();
        print('✅ Current balance: ₱$balance');
        return balance;
      } else {
        print('❌ Failed to fetch balance');
        return null;
      }
    } catch (e) {
      print('❌ Error fetching balance: $e');
      return null;
    }
  }
}
