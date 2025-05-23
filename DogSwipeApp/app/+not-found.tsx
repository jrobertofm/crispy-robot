import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native'; // Added View and Text

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.titleText}>This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff', // Added a default background
  },
  titleText: { // Added style for title
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: { // Added style for link text
    fontSize: 16,
    color: '#007AFF', // Default blue link color
    textAlign: 'center',
  },
});
