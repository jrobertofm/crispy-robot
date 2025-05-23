// [The full content of DogSwipeApp/App.js as obtained in the previous step is inserted here]
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { 
  Provider as PaperProvider, 
  Card, 
  Title, 
  Button, 
  ActivityIndicator, 
  Text as PaperText, // Using PaperText for theming
  Paragraph,
  MD2Colors, // For specific Material Design colors
  useTheme 
} from 'react-native-paper';
import { createClient } from '@supabase/supabase-js';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';

// Supabase Initialization
const supabaseUrl = 'https://rejpnujyyajjlulzhxhk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlanBudWp5eWFqamx1bHpoeGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMjQ5NDAsImV4cCI6MjA2MzYwMDk0MH0.NPy2TN_Y_S_SbQPz6EDcU8fBFJKYakNpb9GxBuZ1_vee0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Main App Component wrapped to use theme
function AppContent() {
  const theme = useTheme(); // Access the theme

  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [currentBreedName, setCurrentBreedName] = useState('Loading breed...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);

  const fetchDogImage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://dog.ceo/api/breeds/image/random');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.status === 'success' && data.message) {
        setCurrentImageUrl(data.message);
        const parts = data.message.split('/');
        if (parts.length >= 2) {
          const breedPart = parts[parts.length - 2];
          setCurrentBreedName(formatBreedName(breedPart));
        } else {
          setCurrentBreedName('Unknown Breed');
        }
      } else {
        throw new Error('Failed to fetch a valid image and breed name.');
      }
    } catch (e) {
      console.error(e);
      setError(`Failed to fetch dog image. ${e.message}`);
      setCurrentBreedName('Error loading breed');
      setCurrentImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function recordSwipe(action, swipedImageUrl, swipedBreedName) {
    if (!swipedImageUrl || !swipedBreedName) {
      console.log("Missing image URL or breed name, skipping database record.");
      return;
    }
    try {
      const { data, error: dbError } = await supabase
        .from('dog_swipes')
        .insert([
          { 
            dog_image_url: swipedImageUrl, 
            breed_name: swipedBreedName, 
            user_action: action 
          }
        ]);
      if (dbError) {
        console.error('Error recording swipe to Supabase:', dbError);
      } else {
        console.log('Swipe recorded successfully:', data);
      }
    } catch (err) {
      console.error('Supabase client-side error:', err);
    }
  }

  const handleSwipeComplete = useCallback((action, swipedImageUrl, swipedBreedName) => {
    console.log(`Swiped: ${action}, Dog: ${swipedBreedName}, Image: ${swipedImageUrl}`);
    if (action === 'accepted' || action === 'rejected') {
        recordSwipe(action, swipedImageUrl, swipedBreedName);
    }
    
    translateX.value = 0;
    rotation.value = 0;
    
    fetchDogImage();
  }, [fetchDogImage, translateX, rotation]);


  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      rotation.value = interpolate(
        translateX.value,
        [-screenWidth / 2, 0, screenWidth / 2],
        [-10, 0, 10],
        Extrapolate.CLAMP
      );
    },
    onEnd: () => {
      const swipedImageUrl = currentImageUrl;
      const swipedBreedName = currentBreedName;

      if (translateX.value < -swipeThreshold) {
        translateX.value = withSpring(-screenWidth * 1.5, { damping: 50 }, () => {
          runOnJS(handleSwipeComplete)('accepted', swipedImageUrl, swipedBreedName);
        });
        rotation.value = withSpring(-60, { damping: 50 });
      } else if (translateX.value > swipeThreshold) {
        translateX.value = withSpring(screenWidth * 1.5, { damping: 50 }, () => {
          runOnJS(handleSwipeComplete)('rejected', swipedImageUrl, swipedBreedName);
        });
        rotation.value = withSpring(60, { damping: 50 });
      } else {
        translateX.value = withSpring(0);
        rotation.value = withSpring(0);
      }
    },
  });

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { rotateZ: `${rotation.value}deg` },
      ],
      opacity: interpolate(
        Math.abs(translateX.value),
        [0, screenWidth / 2],
        [1, 0.5],
        Extrapolate.CLAMP
      ),
    };
  });

  useEffect(() => {
    fetchDogImage();
  }, [fetchDogImage]);

  // Dynamic styles using the theme
  const dynamicStyles = {
    container: {
      backgroundColor: theme.colors.background, // Use theme background
    },
    title: {
      color: theme.colors.primary, // Use theme primary color for title
      marginBottom: 30, // Increased margin
    },
    errorText: {
      color: theme.colors.error, // Use theme error color
    },
    messageText: {
      color: theme.colors.onSurfaceVariant, // A less prominent color for info messages
    },
    cardInnerPlaceholder: {
      backgroundColor: theme.colors.surfaceVariant, // Themed placeholder background
      borderRadius: theme.roundness * 2, // Consistent rounding
    },
    inlineLoader: {
      color: theme.colors.primary, // Themed color for inline loader
    }
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Title style={[styles.title, dynamicStyles.title]}>Would you adopt me?</Title>

      <View style={styles.cardContainer}>
        {isLoading && !currentImageUrl && !error && (
          <View style={styles.centeredMessage}>
            <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
            <PaperText style={[styles.messageText, dynamicStyles.messageText, {marginTop: 15}]}>Loading doggo...</PaperText>
          </View>
        )}

        {error && (
          <View style={styles.centeredMessage}>
            <PaperText style={[styles.errorText, dynamicStyles.errorText]}>{error}</PaperText>
          </View>
        )}
        
        {!error && (
          <PanGestureHandler 
            onGestureEvent={gestureHandler} 
            enabled={!isLoading || !!currentImageUrl}
          >
            <Animated.View style={[
              styles.card, 
              animatedCardStyle, 
              (isLoading && !currentImageUrl) ? styles.hiddenCard : {}
            ]}>
              {currentImageUrl ? (
                <Card style={styles.cardInner}> 
                  <Card.Cover source={{ uri: currentImageUrl }} />
                  <Card.Content style={styles.cardContent}>
                    <Paragraph style={styles.breedName}>{currentBreedName}</Paragraph>
                  </Card.Content>
                  {isLoading && currentImageUrl && (
                     <ActivityIndicator 
                        animating={true} 
                        size="small" 
                        color={dynamicStyles.inlineLoader.color} 
                        style={styles.inlineLoader} />
                  )}
                </Card>
              ) : (
                <View style={[styles.cardInnerPlaceholder, dynamicStyles.cardInnerPlaceholder]} />
              )}
            </Animated.View>
          </PanGestureHandler>
        )}
      </View>

      <Button
        mode="elevated" // Changed mode for better emphasis
        onPress={() => { 
            const swipedImageUrl = currentImageUrl;
            const swipedBreedName = currentBreedName;
            translateX.value = withSpring(screenWidth * 1.5, {damping: 50}, () => {
                runOnJS(handleSwipeComplete)('skipped', swipedImageUrl, swipedBreedName); 
            });
            rotation.value = withSpring(60, {damping: 50});
        }}
        style={styles.button}
        disabled={isLoading && !currentImageUrl}
        icon="arrow-right-bold-outline" // Added an icon
      >
        Skip
      </Button>
    </View>
  );
}

// Helper function to format breed name (remains unchanged)
const formatBreedName = (breedPart) => {
  if (!breedPart) return 'Unknown Breed';
  return breedPart
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const { width: screenWidth } = Dimensions.get('window');
const swipeThreshold = screenWidth * 0.4;

// Styles definition
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around', // Adjusted for better spacing
    alignItems: 'center',
    padding: 20,
    // backgroundColor will be set by theme in dynamicStyles
  },
  title: {
    // fontSize and fontWeight will be largely handled by Paper Title defaults
    // color will be set by theme in dynamicStyles
    textAlign: 'center',
    // marginBottom is now in dynamicStyles
  },
  cardContainer: { 
    width: '95%', // Slightly wider
    maxWidth: 380, // Slightly larger max
    height: 480, // Adjusted height
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25, // Increased margin
  },
  card: { 
    width: '100%', 
    height: '100%',
    position: 'absolute', 
  },
  hiddenCard: {
    opacity: 0,
  },
  cardInner: { 
    width: '100%',
    height: '100%',
    elevation: 5, // Slightly increased elevation
    borderRadius: 12, // Added borderRadius
    backgroundColor: MD2Colors.white, // Explicit white background for the card itself
  },
  cardContent: { // Added for padding inside card content area
    alignItems: 'center', // Center breed name
    paddingTop: 12,
    paddingBottom: 12,
  },
  cardInnerPlaceholder: { 
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor and borderRadius will be set by theme in dynamicStyles
  },
  breedName: { // Will be used with Paper.Paragraph
    fontSize: 18,
    textAlign: 'center',
    // marginTop: 10, // Handled by cardContent padding
  },
  button: {
    marginTop: 25, // Increased margin
    minWidth: '50%', // Ensure button has a decent width
    paddingVertical: 4, // Add some vertical padding to button
  },
  centeredMessage: { 
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%', 
    padding: 20, // Add padding to centered messages
  },
  messageText: { // For "Loading doggo..."
    fontSize: 16,
    textAlign: 'center',
    // color will be set by theme in dynamicStyles
  },
  errorText: { // For error messages
    fontSize: 16,
    textAlign: 'center',
    // color will be set by theme in dynamicStyles
  },
  inlineLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -12, 
    marginTop: -12,
    // color will be set by theme in dynamicStyles
  }
});

// App component that provides the PaperProvider and GestureHandlerRootView
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <AppContent />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
