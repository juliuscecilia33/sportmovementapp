import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VideoAnalysisScreen from './src/screens/VideoAnalysisScreen';
import MovementReportScreen from './src/screens/MovementReportScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { HistoryProvider } from './src/context/HistoryContext';

export type RootStackParamList = {
  VideoAnalysis: { analysisId?: string } | undefined;
  History: undefined;
  MovementReport: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  console.log('[App] ========== App component rendering START ==========');
  console.log('[App] About to render HistoryProvider');
  console.log('[App] About to render NavigationContainer');
  console.log('[App] About to render Stack.Navigator');
  console.log('[App] About to render Stack.Screens');

  return (
    <HistoryProvider>
      <NavigationContainer
        onReady={() => console.log('[App] NavigationContainer ready')}
        onStateChange={(state) => console.log('[App] Navigation state changed:', state?.routes[state.index]?.name)}
      >
        <Stack.Navigator
          initialRouteName="VideoAnalysis"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="VideoAnalysis" component={VideoAnalysisScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="MovementReport" component={MovementReportScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </HistoryProvider>
  );
}
