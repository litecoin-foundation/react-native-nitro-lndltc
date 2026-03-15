#pragma once

#include "HybridLndSpec.hpp"
#include "HybridSubscription.hpp"
#include "liblnd.h"

namespace margelo::nitro::nitrolndltc {

class HybridLnd : public HybridLndSpec {
public:
    HybridLnd() : HybridObject(TAG) {}

    // daemon lifecycle
    std::shared_ptr<Promise<void>> start(const std::string& args) override;

    // WalletUnlocker subserver
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> initWallet(const std::shared_ptr<ArrayBuffer>& data) override;
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> unlockWallet(const std::shared_ptr<ArrayBuffer>& data) override;

    // Lightning subserver
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> walletBalance(const std::shared_ptr<ArrayBuffer>& data) override;
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> estimateFee(const std::shared_ptr<ArrayBuffer>& data) override;
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> newAddress(const std::shared_ptr<ArrayBuffer>& data) override;
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> getInfo(const std::shared_ptr<ArrayBuffer>& data) override;
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> getRecoveryInfo(const std::shared_ptr<ArrayBuffer>& data) override;
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> stopDaemon(const std::shared_ptr<ArrayBuffer>& data) override;
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> getTransactions(const std::shared_ptr<ArrayBuffer>& data) override;
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> sendCoins(const std::shared_ptr<ArrayBuffer>& data) override;

    // WalletKit subserver
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> walletKitLabelTransaction(const std::shared_ptr<ArrayBuffer>& data) override;
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> walletKitListUnspent(const std::shared_ptr<ArrayBuffer>& data) override;
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> walletKitFundPsbt(const std::shared_ptr<ArrayBuffer>& data) override;
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> walletKitFinalizePsbt(const std::shared_ptr<ArrayBuffer>& data) override;
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> walletKitImportMwebScanKey(const std::shared_ptr<ArrayBuffer>& data) override;

    // NeutrinoKit subserver
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> neutrinoKitStatus(const std::shared_ptr<ArrayBuffer>& data) override;

    // streaming rpcs
    std::shared_ptr<HybridSubscriptionSpec> subscribeState(
        const std::shared_ptr<ArrayBuffer>& data,
        const std::function<void(const std::shared_ptr<ArrayBuffer>&)>& onResponse,
        const std::function<void(const std::string&)>& onError) override;
    std::shared_ptr<HybridSubscriptionSpec> subscribeTransactions(
        const std::shared_ptr<ArrayBuffer>& data,
        const std::function<void(const std::shared_ptr<ArrayBuffer>&)>& onResponse,
        const std::function<void(const std::string&)>& onError) override;

private:
    // Helper to create a unary RPC call
    using UnaryRpcFunc = void (*)(char* data, int length, CCallback callback);
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> callUnaryRpc(
        UnaryRpcFunc rpcFunc,
        const std::shared_ptr<ArrayBuffer>& data);

    // Helper to create a server-streaming RPC call
    using StreamRpcFunc = void (*)(char* data, int length, CRecvStream rStream);
    std::shared_ptr<HybridSubscriptionSpec> callStreamRpc(
        StreamRpcFunc rpcFunc,
        const std::shared_ptr<ArrayBuffer>& data,
        const std::function<void(const std::shared_ptr<ArrayBuffer>&)>& onResponse,
        const std::function<void(const std::string&)>& onError);
};

} // namespace margelo::nitro::nitrolndltc
