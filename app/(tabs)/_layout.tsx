import { Link, Tabs } from 'expo-router';
import { View, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { speechService } from '../../utils/speech';
import SpeechPlayer from '../../components/SpeechPlayer';

export default function TabLayout() {
  const [showSpeechPlayer, setShowSpeechPlayer] = useState(false);

  useEffect(() => {
    const checkSpeechStatus = () => {
      const isPlaying = speechService.isCurrentlyPlaying();
      setShowSpeechPlayer(isPlaying);
    };

    // Check status immediately
    checkSpeechStatus();

    // Set up interval to check status
    const interval = setInterval(checkSpeechStatus, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#F97316', // Saffron color
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            elevation: 0,
            backgroundColor: '#FFFFFF',
            height: 60,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerShown: false,
        }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "sunny" : "sunny-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "library" : "library-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "trending-up" : "trending-up-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      </Tabs>

      <SpeechPlayer
        isVisible={showSpeechPlayer}
        onClose={() => setShowSpeechPlayer(false)}
      />
    </SafeAreaView>
  );
}
