#pragma once

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef void (*ResponseFunc)(void* context, const char* data, int length);
typedef void (*ErrorFunc)(void* context, const char* error);

typedef struct CCallback {
    ResponseFunc onResponse;
    ErrorFunc onError;
    void* responseContext;
    void* errorContext;
} CCallback;

typedef struct CRecvStream {
    ResponseFunc onResponse;
    ErrorFunc onError;
    void* responseContext;
    void* errorContext;
} CRecvStream;

// daemon lifecycle
extern void start(char* extraArgs, CCallback callback);
extern void stopDaemon(char* data, int length, CCallback callback);

// WalletUnlocker subserver
extern void genSeed(char* data, int length, CCallback callback);
extern void initWallet(char* data, int length, CCallback callback);
extern void unlockWallet(char* data, int length, CCallback callback);

// Lightning subserver
extern void walletBalance(char* data, int length, CCallback callback);
extern void estimateFee(char* data, int length, CCallback callback);
extern void newAddress(char* data, int length, CCallback callback);
extern void getInfo(char* data, int length, CCallback callback);
extern void getRecoveryInfo(char* data, int length, CCallback callback);
extern void getTransactions(char* data, int length, CCallback callback);
extern void sendCoins(char* data, int length, CCallback callback);

// Lightning subserver
extern void subscribeState(char* data, int length, CRecvStream rStream);
extern void subscribeTransactions(char* data, int length, CRecvStream rStream);

// WalletKit subserver
extern void walletKitImportAccount(char* data, int length, CCallback callback);
extern void walletKitListAccounts(char* data, int length, CCallback callback);
extern void walletKitListAddresses(char* data, int length, CCallback callback);
extern void walletKitListLeases(char* data, int length, CCallback callback);
extern void walletKitListUnspent(char* data, int length, CCallback callback);
extern void walletKitLabelTransaction(char* data, int length, CCallback callback);
extern void walletKitReleaseOutput(char* data, int length, CCallback callback);
extern void walletKitPublishTransaction(char* data, int length, CCallback callback);
extern void walletKitSignMessageWithAddr(char* data, int length, CCallback callback);
extern void walletKitVerifyMessageWithAddr(char* data, int length, CCallback callback);
extern void walletKitSignPsbt(char* data, int length, CCallback callback);
extern void walletKitFundPsbt(char* data, int length, CCallback callback);
extern void walletKitFinalizePsbt(char* data, int length, CCallback callback);
extern void walletKitImportMwebScanKey(char* data, int length, CCallback callback);

// NeutrinoKit subserver
extern void neutrinoKitStatus(char* data, int length, CCallback callback);

#ifdef __cplusplus
}
#endif
