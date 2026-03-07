#!/bin/bash

# Fix for Xcode 15+ SDKROOT error
# Run this script from the ios directory

echo "Cleaning Flutter build..."
cd ..
flutter clean

echo "Removing Pods and Podfile.lock..."
cd ios
rm -rf Pods
rm -f Podfile.lock

echo "Running pod install..."
pod install

echo "Done! Now try building again."
