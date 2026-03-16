import React from 'react'
import { Tabs } from 'expo-router'
import { SymbolView } from 'expo-symbols'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#345d9d' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Daemon',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'bolt.fill', android: 'bolt', web: 'bolt' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'wallet.bifold.fill',
                android: 'wallet',
                web: 'wallet',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: 'Info',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'info.circle.fill',
                android: 'info',
                web: 'info',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  )
}
