import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAppStore } from '../store'
import LoginScreen from '../pages/LoginScreen'
import CoupleScreen from '../pages/CoupleScreen'
import HomeScreen from '../pages/HomeScreen'
import ShopScreen from '../pages/ShopScreen'
import LettersScreen from '../pages/LettersScreen'
import ProfileScreen from '../pages/ProfileScreen'
import CalendarScreen from '../pages/CalendarScreen'
import AchievementsScreen from '../pages/AchievementsScreen'
import { Colors, FontSizes } from '../theme'
import { Text } from 'react-native'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  const { couple, user } = useAppStore()
  if (!couple || !user) return null

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border, height: 60, paddingBottom: 8, paddingTop: 4 },
        tabBarActiveTintColor: Colors.love,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: FontSizes.xs },
      }}
    >
      <Tab.Screen name="HomeTab" options={{ tabBarLabel: '首页', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }}>
        {() => <HomeScreen couple={couple!} user={user!} />}
      </Tab.Screen>
      <Tab.Screen name="CalendarTab" component={CalendarScreen} options={{ tabBarLabel: '日历', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📅</Text> }} />
      <Tab.Screen name="ShopTab" component={ShopScreen} options={{ tabBarLabel: '商店', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏪</Text> }} />
      <Tab.Screen name="LettersTab" component={LettersScreen} options={{ tabBarLabel: '信箱', tabBarIcon: () => <Text style={{ fontSize: 20 }}>✉️</Text> }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: '我的', tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }} />
    </Tab.Navigator>
  )
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ headerShown: true, title: '🏅 成就', headerStyle: { backgroundColor: Colors.surface }, headerTintColor: Colors.white }} />
    </Stack.Navigator>
  )
}

export default function AppNavigator() {
  const { user, loading } = useAppStore()

  if (loading) return null

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !user.couple_id ? (
          <Stack.Screen name="Couple" component={CoupleScreen} />
        ) : (
          <Stack.Screen name="AppStack" component={AppStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
