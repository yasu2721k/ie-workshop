import { EyePositions } from '@/types/diagnosis';

/**
 * Crops the eye region from a full face image
 * @param imageData - Base64 encoded full face image
 * @param eyePositions - Eye positions from MediaPipe (normalized coordinates)
 * @param cropSize - Size of the cropped region (default: 200x150)
 * @returns Promise with cropped left and right eye images as base64
 */
export async function cropEyeRegions(
  imageData: string,
  eyePositions: EyePositions,
  cropSize: { width: number; height: number } = { width: 200, height: 150 }
): Promise<{ leftEyeImage: string; rightEyeImage: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Create canvas for processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Function to crop a single eye region
        const cropEye = (eyeX: number, eyeY: number): string => {
          canvas.width = cropSize.width;
          canvas.height = cropSize.height;

          // Convert normalized coordinates to pixel coordinates
          const centerX = eyeX * img.width;
          const centerY = eyeY * img.height;

          // Calculate crop region (centered on eye)
          const startX = centerX - cropSize.width / 2;
          const startY = centerY - cropSize.height / 2;

          // Draw cropped region
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            img,
            startX,
            startY,
            cropSize.width,
            cropSize.height,
            0,
            0,
            cropSize.width,
            cropSize.height
          );

          return canvas.toDataURL('image/jpeg', 0.95);
        };

        // Note: MediaPipe coordinates are normalized (0-1)
        // and the camera image is mirrored, so left/right are swapped
        const leftEyeImage = cropEye(eyePositions.rightEye.x, eyePositions.rightEye.y);
        const rightEyeImage = cropEye(eyePositions.leftEye.x, eyePositions.leftEye.y);

        resolve({ leftEyeImage, rightEyeImage });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageData;
  });
}

/**
 * Combines two images (neutral and smile) for expression analysis
 * @param neutralImage - Base64 encoded neutral expression image
 * @param smileImage - Base64 encoded smile expression image
 * @returns Promise with combined comparison image as base64
 */
export async function createExpressionComparison(
  neutralImage: string,
  smileImage: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img1 = new Image();
    const img2 = new Image();
    let loadCount = 0;

    const onLoad = () => {
      loadCount++;
      if (loadCount === 2) {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Create side-by-side comparison
          canvas.width = img1.width + img2.width;
          canvas.height = Math.max(img1.height, img2.height);

          // Draw neutral image on left
          ctx.drawImage(img1, 0, 0);

          // Draw smile image on right
          ctx.drawImage(img2, img1.width, 0);

          // Add labels
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';

          // Neutral label
          ctx.strokeText('真顔', img1.width / 2, 40);
          ctx.fillText('真顔', img1.width / 2, 40);

          // Smile label
          ctx.strokeText('笑顔', img1.width + img2.width / 2, 40);
          ctx.fillText('笑顔', img1.width + img2.width / 2, 40);

          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch (error) {
          reject(error);
        }
      }
    };

    img1.onload = onLoad;
    img2.onload = onLoad;
    img1.onerror = () => reject(new Error('Failed to load neutral image'));
    img2.onerror = () => reject(new Error('Failed to load smile image'));

    img1.src = neutralImage;
    img2.src = smileImage;
  });
}