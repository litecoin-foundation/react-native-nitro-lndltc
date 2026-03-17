#pragma once

#include <condition_variable>
#include <memory>
#include <mutex>
#include <stdexcept>
#include <string>
#include <NitroModules/Promise.hpp>
#include <NitroModules/ArrayBuffer.hpp>

namespace margelo::nitro::nitrolndltc {

using namespace margelo::nitro;

// Thread-safe result container for bridging Go's async callbacks to
// NitroModules' Promise system. The Go callback sets the result/error,
// and Promise::async's thread pool waits for it and throws on error.
template <typename T>
struct RpcResult {
    void resolve(T value) {
        std::lock_guard<std::mutex> lock(mutex_);
        value_ = std::move(value);
        ready_ = true;
        cv_.notify_one();
    }

    void reject(std::string error) {
        std::lock_guard<std::mutex> lock(mutex_);
        error_ = std::move(error);
        hasError_ = true;
        ready_ = true;
        cv_.notify_one();
    }

    // Blocks until Go callback fires, then returns value or throws.
    // MUST be called from Promise::async's thread pool so the throw
    // happens inside NitroModules' compilation unit.
    T await() {
        std::unique_lock<std::mutex> lock(mutex_);
        cv_.wait(lock, [this] { return ready_; });
        if (hasError_) {
            throw std::runtime_error(error_);
        }
        return std::move(value_);
    }

private:
    std::mutex mutex_;
    std::condition_variable cv_;
    bool ready_ = false;
    bool hasError_ = false;
    T value_;
    std::string error_;
};

// Specialization for void (used by start())
template <>
struct RpcResult<void> {
    void resolve() {
        std::lock_guard<std::mutex> lock(mutex_);
        ready_ = true;
        cv_.notify_one();
    }

    void reject(std::string error) {
        std::lock_guard<std::mutex> lock(mutex_);
        error_ = std::move(error);
        hasError_ = true;
        ready_ = true;
        cv_.notify_one();
    }

    void await() {
        std::unique_lock<std::mutex> lock(mutex_);
        cv_.wait(lock, [this] { return ready_; });
        if (hasError_) {
            throw std::runtime_error(error_);
        }
    }

private:
    std::mutex mutex_;
    std::condition_variable cv_;
    bool ready_ = false;
    bool hasError_ = false;
    std::string error_;
};

// Heap-allocated context for unary RPCs. Go callback populates the
// shared RpcResult, which is awaited by Promise::async.
struct UnaryContext {
    std::shared_ptr<RpcResult<std::shared_ptr<ArrayBuffer>>> result;

    static void onResponse(void* ctx, const char* data, int length) {
        auto* self = static_cast<UnaryContext*>(ctx);
        auto buffer = ArrayBuffer::copy(
            reinterpret_cast<const uint8_t*>(data),
            static_cast<size_t>(length)
        );
        self->result->resolve(std::move(buffer));
        delete self;
    }

    static void onError(void* ctx, const char* error) {
        auto* self = static_cast<UnaryContext*>(ctx);
        self->result->reject(error ? std::string(error) : "unknown RPC error");
        delete self;
    }
};

// Heap-allocated context for start() which returns void.
struct VoidContext {
    std::shared_ptr<RpcResult<void>> result;

    static void onResponse(void* ctx, const char* /*data*/, int /*length*/) {
        auto* self = static_cast<VoidContext*>(ctx);
        self->result->resolve();
        delete self;
    }

    static void onError(void* ctx, const char* error) {
        auto* self = static_cast<VoidContext*>(ctx);
        self->result->reject(error ? std::string(error) : "unknown RPC error");
        delete self;
    }
};

} // namespace margelo::nitro::nitrolndltc
