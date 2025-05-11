import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { commonStyles } from '../../styles/commonStyles';

const DocumentUpload = ({
    uri,
    onSelect,
    onRemove,
    iconName,
    buttonText,
    isUploading,
    uploadProgress
}) => {
    return (
        <View style={styles.container}>
            {!uri ? (
                <TouchableOpacity
                    style={[
                        styles.uploadButton,
                        isUploading && styles.disabledButton
                    ]}
                    onPress={onSelect}
                    disabled={isUploading}
                >
                    <FontAwesome5 
                        name={iconName} 
                        size={16} 
                        color={isUploading ? '#999' : '#003580'} 
                    />
                    <Text style={[
                        styles.uploadButtonText,
                        isUploading && styles.disabledText
                    ]}>
                        {buttonText}
                    </Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.previewContainer}>
                    <Image
                        source={{ uri }}
                        style={styles.preview}
                        resizeMode="contain"
                    />
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={onRemove}
                        disabled={isUploading}
                    >
                        <FontAwesome5 name="times" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            )}
            
            {isUploading && (
                <View style={styles.progressContainer}>
                    <ActivityIndicator size="small" color="#003580" />
                    <Text style={styles.progressText}>
                        Uploading... {uploadProgress ? `${Math.round(uploadProgress)}%` : ''}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: '#F5F5F5',
        borderColor: '#EEEEEE',
    },
    uploadButtonText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '500',
        color: '#003580',
    },
    disabledText: {
        color: '#999',
    },
    previewContainer: {
        position: 'relative',
        alignItems: 'center',
    },
    preview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        backgroundColor: '#F5F7FA',
    },
    removeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        justifyContent: 'center',
    },
    progressText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#666',
    },
});

export default DocumentUpload; 