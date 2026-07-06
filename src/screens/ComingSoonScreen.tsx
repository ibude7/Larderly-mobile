import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';
import { useAppColors } from '../hooks/useAppColors';

const NOTIFY_KEY = 'larderly:mealPlannerNotify';
const mealPlannerAnimation = require('../../assets/lottie/meal-planner-coming-soon.json');

export default function ComingSoonScreen() {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [notifySaved, setNotifySaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(NOTIFY_KEY)
      .then((value) => setNotifySaved(value === '1'))
      .catch(() => {});
  }, []);

  const handleNotify = async () => {
    await AsyncStorage.setItem(NOTIFY_KEY, '1');
    setNotifySaved(true);
    showToast("We'll let you know when Meal Planner is ready", 'success');
  };

  return (
    <View
      className="flex-1 items-center justify-center bg-canvas px-8 dark:bg-canvas-dark"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 96 }}
    >
      <Text className="text-6xl">🍳</Text>

      <View className="mt-2 h-56 w-56 items-center justify-center">
        <LottieView
          source={mealPlannerAnimation}
          autoPlay
          loop
          style={{ width: 220, height: 220 }}
        />
      </View>

      <Text className="mt-4 text-center text-3xl font-black text-ink dark:text-ink-dark">
        Meal Planner
      </Text>
      <Text className="mt-3 max-w-[320px] text-center text-base font-medium leading-6 text-muted dark:text-muted-dark">
        AI-powered meal planning from your pantry. Coming soon.
      </Text>

      <View className="mt-8 w-full max-w-[260px]">
        <Button
          label={notifySaved ? 'Notifications on' : 'Notify me'}
          icon={notifySaved ? 'check' : 'bell'}
          variant="secondary"
          onPress={handleNotify}
          disabled={notifySaved}
        />
      </View>

      <View
        className="mt-6 h-1 w-16 rounded-full"
        style={{ backgroundColor: `${c.primary}33` }}
      />
    </View>
  );
}
