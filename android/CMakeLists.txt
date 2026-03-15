project(NitroLndltc)
cmake_minimum_required(VERSION 3.9.0)

set(PACKAGE_NAME NitroLndltc)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

# Define C++ library and add all sources
add_library(${PACKAGE_NAME} SHARED
        src/main/cpp/cpp-adapter.cpp
        ../cpp/HybridLnd.cpp
)

# Add Nitrogen specs
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/NitroLndltc+autolinking.cmake)

# Set up local includes
include_directories(
        "src/main/cpp"
        "../cpp"
)

# liblnd - consumer app provides liblnd.so in jniLibs
set(DEFAULT_LND_JNILIBS_PATH "${CMAKE_CURRENT_SOURCE_DIR}/../../../android/app/src/main/jniLibs")
if(LND_JNILIBS_PATH)
    set(FINAL_LND_JNILIBS_PATH ${LND_JNILIBS_PATH})
else()
    set(FINAL_LND_JNILIBS_PATH ${DEFAULT_LND_JNILIBS_PATH})
endif()

set(LND_LIBRARY_PATH "${FINAL_LND_JNILIBS_PATH}/${CMAKE_ANDROID_ARCH_ABI}/liblnd.so")

add_library(lib_lnd SHARED IMPORTED)
set_property(TARGET lib_lnd PROPERTY IMPORTED_NO_SONAME 1)
set_target_properties(lib_lnd PROPERTIES IMPORTED_LOCATION ${LND_LIBRARY_PATH})

find_library(LOG_LIB log)

# Link all libraries together
target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        android
        lib_lnd
)
