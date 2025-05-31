interface GenerateRequest {
  prompt: string;
  imageUrl?: string;
}

interface GenerateResponse {
  scenes: string[];
  backgroundRemovedUrl?: string;
  // Add other response fields as needed
}

interface RemoveBackgroundResponse {
  background_removed_url: string;
}

export async function generateAdventure(
  prompt: string,
  imageUrl?: string
): Promise<GenerateResponse> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  console.log('API_URL', API_URL);
  
  if (!API_URL) {
    throw new Error('API URL not defined in environment variables');
  }

  try {
    // Create both API requests to be executed concurrently
    const generateScenesPromise = fetch(`${API_URL}/generate-scenes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
      }),
    });
    
    // Only call remove-background if an image URL is provided
    let removeBackgroundPromise = null;
    if (imageUrl) {
      removeBackgroundPromise = fetch(`${API_URL}/remove-background/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
        }),
      });
    }
    
    // Wait for both requests to complete concurrently
    const results = await Promise.all([
      generateScenesPromise,
      ...(removeBackgroundPromise ? [removeBackgroundPromise] : []),
    ]);
    
    // Process generate-scenes response
    if (!results[0].ok) {
      const errorText = await results[0].text();
      throw new Error(`Generate scenes API error: ${results[0].status} - ${errorText}`);
    }
    const scenesData = await results[0].json();
    
    // Process remove-background response if it was called
    let backgroundRemovedUrl = undefined;
    if (removeBackgroundPromise) {
      if (!results[1].ok) {
        console.error(`Remove background API error: ${results[1].status}`);
      } else {
        const backgroundData: RemoveBackgroundResponse = await results[1].json();
        backgroundRemovedUrl = backgroundData.background_removed_url;
      }
    }
    
    // Combine results
    return {
      scenes: scenesData.scenes,
      backgroundRemovedUrl
    };
  } catch (error) {
    console.error('Error generating adventure:', error);
    throw error;
  }
}
