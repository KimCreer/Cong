import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { FontAwesome5 } from "@expo/vector-icons";
import { styles } from '../styles/styles';

const DocumentUpload = ({
  uri,
  onSelect,
  onRemove,
  iconName,
  buttonText,
  isUploading
}) => {
  return (
    <View style={styles.imageSection}>
      <TouchableOpacity 
        style={styles.imageButton}
        onPress={onSelect}
        disabled={isUploading}
        activeOpacity={0.7}
      >
        <FontAwesome5 
          name={iconName} 
          size={16} 
          color={isUploading ? "#999" : "#003580"} 
        />
        <Text style={[
          styles.imageButtonText,
          isUploading && styles.disabledText
        ]}>
          {uri ? `Change ${buttonText}` : buttonText}
        </Text>
      </TouchableOpacity>
      
      {uri && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri }} style={styles.imagePreview} />
          <TouchableOpacity 
            style={styles.removeImageButton}
            onPress={onRemove}
            disabled={isUploading}
          >
            <FontAwesome5 name="times" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default DocumentUpload; 