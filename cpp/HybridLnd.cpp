#include "HybridLnd.hpp"
#include "PromiseKeeper.hpp"
#include "CallbackKeeper.hpp"

namespace margelo::nitro::nitrolndltc {

// helpers

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::callUnaryRpc(UnaryRpcFunc rpcFunc, const std::shared_ptr<ArrayBuffer>& data) {
    auto promise = Promise<std::shared_ptr<ArrayBuffer>>::create();
    auto* ctx = new UnaryContext{promise};

    CCallback cb = {
        .onResponse = &UnaryContext::onResponse,
        .onError = &UnaryContext::onError,
        .responseContext = static_cast<void*>(ctx),
        .errorContext = static_cast<void*>(ctx)
    };

    rpcFunc(
        reinterpret_cast<char*>(data->data()),
        static_cast<int>(data->size()),
        cb
    );

    return promise;
}

std::shared_ptr<HybridSubscriptionSpec>
HybridLnd::callStreamRpc(
    StreamRpcFunc rpcFunc,
    const std::shared_ptr<ArrayBuffer>& data,
    const std::function<void(const std::shared_ptr<ArrayBuffer>&)>& onResponse,
    const std::function<void(const std::string&)>& onError) {

    auto cancelled = std::make_shared<std::atomic<bool>>(false);
    auto* ctx = new StreamContext{onResponse, onError, cancelled};

    CRecvStream rs = {
        .onResponse = &StreamContext::onResponseCb,
        .onError = &StreamContext::onErrorCb,
        .responseContext = static_cast<void*>(ctx),
        .errorContext = static_cast<void*>(ctx)
    };

    rpcFunc(
        reinterpret_cast<char*>(data->data()),
        static_cast<int>(data->size()),
        rs
    );

    return std::make_shared<HybridSubscription>(cancelled);
}

// daemon lifecycle

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::start(const std::string& args) {
    auto promise = Promise<std::shared_ptr<ArrayBuffer>>::create();
    auto* ctx = new VoidContext{promise};

    CCallback cb = {
        .onResponse = &VoidContext::onResponse,
        .onError = &VoidContext::onError,
        .responseContext = static_cast<void*>(ctx),
        .errorContext = static_cast<void*>(ctx)
    };

    // start() takes char* (mutable) - make a local copy.
    // Go copies the string via C.GoString() before spawning a goroutine.
    std::string argsCopy = args;
    ::start(argsCopy.data(), cb);

    return promise;
}

// WalletUnlocker subserver

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::genSeed(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::genSeed, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::initWallet(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::initWallet, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::unlockWallet(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::unlockWallet, data);
}

// Lightning subserver

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::walletBalance(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::walletBalance, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::estimateFee(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::estimateFee, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::newAddress(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::newAddress, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::getInfo(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::getInfo, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::getRecoveryInfo(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::getRecoveryInfo, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::stopDaemon(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::stopDaemon, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::getTransactions(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::getTransactions, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::sendCoins(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::sendCoins, data);
}

// WalletKit subserver

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::walletKitImportAccount(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::walletKitImportAccount, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::walletKitListAccounts(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::walletKitListAccounts, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::walletKitListAddresses(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::walletKitListAddresses, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::walletKitListLeases(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::walletKitListLeases, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::walletKitListUnspent(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::walletKitListUnspent, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::walletKitLabelTransaction(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::walletKitLabelTransaction, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::walletKitReleaseOutput(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::walletKitReleaseOutput, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::walletKitPublishTransaction(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::walletKitPublishTransaction, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::walletKitSignMessageWithAddr(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::walletKitSignMessageWithAddr, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::walletKitVerifyMessageWithAddr(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::walletKitVerifyMessageWithAddr, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::walletKitSignPsbt(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::walletKitSignPsbt, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::walletKitFundPsbt(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::walletKitFundPsbt, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::walletKitFinalizePsbt(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::walletKitFinalizePsbt, data);
}

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::walletKitImportMwebScanKey(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::walletKitImportMwebScanKey, data);
}

// NeutrinoKit subserver

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>>
HybridLnd::neutrinoKitStatus(const std::shared_ptr<ArrayBuffer>& data) {
    return callUnaryRpc(::neutrinoKitStatus, data);
}

// streaming rpcs

std::shared_ptr<HybridSubscriptionSpec>
HybridLnd::subscribeState(
    const std::shared_ptr<ArrayBuffer>& data,
    const std::function<void(const std::shared_ptr<ArrayBuffer>&)>& onResponse,
    const std::function<void(const std::string&)>& onError) {
    return callStreamRpc(::subscribeState, data, onResponse, onError);
}

std::shared_ptr<HybridSubscriptionSpec>
HybridLnd::subscribeTransactions(
    const std::shared_ptr<ArrayBuffer>& data,
    const std::function<void(const std::shared_ptr<ArrayBuffer>&)>& onResponse,
    const std::function<void(const std::string&)>& onError) {
    return callStreamRpc(::subscribeTransactions, data, onResponse, onError);
}

} // namespace margelo::nitro::nitrolndltc
