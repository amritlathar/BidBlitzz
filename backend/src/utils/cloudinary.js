import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Log Cloudinary configuration (without sensitive data)
console.log('Cloudinary Configuration:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
});

export const uploadToCloudinary = async (buffer) => {
    try {
        if (!buffer) {
            throw new Error('No image buffer provided');
        }

        console.log('Buffer received:', {
            exists: !!buffer,
            length: buffer.length,
            type: buffer.constructor.name
        });

        // Convert buffer to base64
        const b64 = Buffer.from(buffer).toString('base64');
        const dataURI = 'data:image/jpeg;base64,' + b64;
        
        console.log('Attempting Cloudinary upload...');
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'user_avatars',
            resource_type: 'auto',
            transformation: [
                { width: 200, height: 200, crop: 'fill' }
            ]
        });
        
        console.log('Cloudinary upload result:', {
            success: !!result,
            hasUrl: !!result?.secure_url,
            publicId: result?.public_id
        });

        if (!result || !result.secure_url) {
            throw new Error('Failed to get upload URL from Cloudinary');
        }

        return {
            secure_url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('Error uploading to Cloudinary:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        throw new Error(`Failed to upload image: ${error.message}`);
    }
};

export const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            console.warn('No public_id provided for deletion');
            return;
        }
        console.log('Attempting to delete from Cloudinary:', publicId);
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Cloudinary deletion result:', result);
    } catch (error) {
        console.error('Error deleting from Cloudinary:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            publicId
        });
        throw new Error(`Failed to delete image: ${error.message}`);
    }
}; 