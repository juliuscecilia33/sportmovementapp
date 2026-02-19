import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VideoAnalysisScreen from './src/screens/VideoAnalysisScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { HistoryProvider } from './src/context/HistoryContext';

export type RootStackParamList = {
  VideoAnalysis: { analysisId?: string } | undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <HistoryProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="VideoAnalysis"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="VideoAnalysis" component={VideoAnalysisScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </HistoryProvider>
  );
}
