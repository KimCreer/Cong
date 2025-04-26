import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  Animated, 
  StyleSheet,
  ActivityIndicator  // Added this import
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PostImage = React.memo(({ uri }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (error) {
    return (
      <View style={[styles.postImage, styles.imageError]}>
        <Icon name="image-off" size={40} color="#ccc" />
        <Text style={styles.imageErrorText}>Couldn't load image</Text>
      </View>
    );
  }

  return (
    <View>
      <Animated.Image
        source={{ uri }}
        style={[styles.postImage, { opacity: fadeAnim }]}
        resizeMode="cover"
        onLoadEnd={() => {
          setLoading(false);
          fadeIn();
        }}
        onError={() => setError(true)}
        accessibilityLabel="Post image"
      />
      {loading && (
        <View style={styles.imageLoader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  postImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#f1f3f5',
  },
  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  imageError: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  imageErrorText: {
    marginTop: 8,
    color: '#adb5bd',
  },
});

export default PostImage;