import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '../data/cloudinaryConfig';

/**
 * Uploads an image to Cloudinary
 * @param {string} imageUri - The local URI of the image to upload
 * @param {string} folder - Optional folder name in Cloudinary
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export const uploadToCloudinary = async (imageUri, folder = null) => {
    if (!imageUri) {
        throw new Error('No image URI provided');
    }

    try {
        const formData = new FormData();
        const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
        
        // Append the file
        formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: filename || 'upload.jpg'
        });

        // Append upload preset
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        // Append folder if specified
        if (folder) {
            formData.append('folder', folder);
        }

        // Make the upload request
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `Upload failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`
            );
        }

        const data = await response.json();
        
        if (!data.secure_url) {
            throw new Error('No secure URL returned from Cloudinary');
        }

        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', {
            message: error.message,
            imageUri: imageUri.substring(0, 50) + '...', // Log partial URI for debugging
            folder,
        });
        throw error;
    }
};

/**
 * Validates if a URL is a valid Cloudinary URL
 * @param {string} url - The URL to validate
 * @returns {boolean}
 */
export const isValidCloudinaryUrl = (url) => {
    if (!url) return false;
    return url.includes('cloudinary.com') && url.includes('djisnlxc4');
}; 