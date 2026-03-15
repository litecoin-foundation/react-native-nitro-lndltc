#pragma once

#include <memory>
#include <stdexcept>
#include <string>
#include <NitroModules/Promise.hpp>
#include <NitroModules/ArrayBuffer.hpp>

namespace margelo::nitro::nitrolndltc {

using namespace margelo::nitro;

// Heap-allocated context passed through Go's void* callback pointers.
struct UnaryContext {
    std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> promise;

    static void onResponse(void* ctx, const char* data, int length) {
        auto* self = static_cast<UnaryContext*>(ctx);
        auto buffer = ArrayBuffer::copy(
            reinterpret_cast<const uint8_t*>(data),
            static_cast<size_t>(length)
        );
        self->promise->resolve(std::move(buffer));
        delete self;
    }

    static void onError(void* ctx, const char* error) {
        auto* self = static_cast<UnaryContext*>(ctx);
        self->promise->reject(std::make_exception_ptr(
            std::runtime_error(std::string(error))));
        delete self;
    }
};

struct VoidContext {
    std::shared_ptr<Promise<void>> promise;

    static void onResponse(void* ctx, const char* /*data*/, int /*length*/) {
        auto* self = static_cast<VoidContext*>(ctx);
        self->promise->resolve();
        delete self;
    }

    static void onError(void* ctx, const char* error) {
        auto* self = static_cast<VoidContext*>(ctx);
        self->promise->reject(std::make_exception_ptr(
            std::runtime_error(std::string(error))));
        delete self;
    }
};

} // namespace margelo::nitro::nitrolndltc
