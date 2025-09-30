import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const ProductImageUpload = ({ productId, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setError(null);
  };

  async function uploadImage() {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    if (!productId) {
      setError('Product ID is missing. Please save the product before uploading an image.');
      return;
    }

    setUploading(true);
    setError(null);

    const fileName = `public/${productId}-${Date.now()}-${file.name}`;

    try {
      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Could not retrieve the public URL for the image.');
      }

      const publicUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('productos')
        .update({ image_url: publicUrl })
        .eq('id', productId);

      if (updateError) {
        throw updateError;
      }

      if (onUploadSuccess) {
        onUploadSuccess(publicUrl);
      }

      alert('Image uploaded and product updated successfully!');

    } catch (error) {
      console.error('Error uploading image:', error);
      setError(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="my-4">
      <label className="block text-sm font-medium text-gray-700">
        Product Image
      </label>
      <div className="mt-1 flex items-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="mr-2"
        />
        <button
          onClick={uploadImage}
          disabled={uploading || !file}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default ProductImageUpload;