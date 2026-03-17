#pragma once

#include <cstring>
#include <memory>
#include <string>
#include <NitroModules/Promise.hpp>
#include <NitroModules/ArrayBuffer.hpp>

namespace margelo::nitro::nitrolndltc {

using namespace margelo::nitro;

struct UnaryContext {
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> promise;

    static void onResponse(void* ctx, const char* data, int length) {
        auto* self = static_cast<UnaryContext*>(ctx);
        size_t len = static_cast<size_t>(length);
        auto envelope = ArrayBuffer::allocate(1 + len);
        envelope->data()[0] = 0x00; // success
        if (len > 0) {
            std::memcpy(envelope->data() + 1, data, len);
        }
        self->promise->resolve(std::move(envelope));
        delete self;
    }

    static void onError(void* ctx, const char* error) {
        auto* self = static_cast<UnaryContext*>(ctx);
        std::string msg = error ? std::string(error) : "unknown RPC error";
        auto envelope = ArrayBuffer::allocate(1 + msg.size());
        envelope->data()[0] = 0x01; // error
        std::memcpy(envelope->data() + 1, msg.data(), msg.size());
        self->promise->resolve(std::move(envelope));
        delete self;
    }
};

struct VoidContext {
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> promise;

    static void onResponse(void* ctx, const char* /*data*/, int /*length*/) {
        auto* self = static_cast<VoidContext*>(ctx);
        auto envelope = ArrayBuffer::allocate(1);
        envelope->data()[0] = 0x00; // success
        self->promise->resolve(std::move(envelope));
        delete self;
    }

    static void onError(void* ctx, const char* error) {
        auto* self = static_cast<VoidContext*>(ctx);
        std::string msg = error ? std::string(error) : "unknown RPC error";
        auto envelope = ArrayBuffer::allocate(1 + msg.size());
        envelope->data()[0] = 0x01; // error
        std::memcpy(envelope->data() + 1, msg.data(), msg.size());
        self->promise->resolve(std::move(envelope));
        delete self;
    }
};

} // namespace margelo::nitro::nitrolndltc
