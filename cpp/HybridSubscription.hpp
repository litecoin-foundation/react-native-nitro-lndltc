#pragma once

#include <atomic>
#include <memory>
#include "HybridSubscriptionSpec.hpp"

namespace margelo::nitro::nitrolndltc {

class HybridSubscription : public HybridSubscriptionSpec {
public:
    explicit HybridSubscription(std::shared_ptr<std::atomic<bool>> cancelled)
        : HybridObject(TAG), cancelled_(std::move(cancelled)) {}

    ~HybridSubscription() override {
        cancel();
    }

    void cancel() override {
        cancelled_->store(true);
    }

private:
    std::shared_ptr<std::atomic<bool>> cancelled_;
};

} // namespace margelo::nitro::nitrolndltc
