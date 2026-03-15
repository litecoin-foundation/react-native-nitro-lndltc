#pragma once

#include <atomic>
#include <functional>
#include <memory>
#include <string>
#include <NitroModules/ArrayBuffer.hpp>

namespace margelo::nitro::nitrolndltc {

using namespace margelo::nitro;

// Heap-allocated context for server-streaming RPCs.
// The cancelled flag is shared with HybridSubscription so cancel() can
// suppress callbacks without needing a global registry or mutex.
// Lifetime: allocated when the stream starts, deleted when Go's read-stream
// loop exits (onError). The Go goroutine owns the context's lifetime.

struct StreamContext {
    std::function<void(const std::shared_ptr<ArrayBuffer>&)> onResponse;
    std::function<void(const std::string&)> onError;
    std::shared_ptr<std::atomic<bool>> cancelled;

    static void onResponseCb(void* ctx, const char* data, int length) {
        auto* self = static_cast<StreamContext*>(ctx);
        if (self->cancelled->load()) return;
        if (self->onResponse) {
            auto buffer = ArrayBuffer::copy(
                reinterpret_cast<const uint8_t*>(data),
                static_cast<size_t>(length)
            );
            self->onResponse(buffer);
        }
    }

    static void onErrorCb(void* ctx, const char* error) {
        auto* self = static_cast<StreamContext*>(ctx);
        // Invoke error callback only if not cancelled.
        if (!self->cancelled->load() && self->onError) {
            self->onError(std::string(error));
        }
        // Always delete: Go's read-stream loop exits permanently on error,
        // so no more callbacks will arrive for this context.
        delete self;
    }
};

} // namespace margelo::nitro::nitrolndltc
