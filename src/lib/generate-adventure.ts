interface GenerateRequest {
  prompt: string;
  imageUrl?: string;
}

interface GenerateResponse {
  scenes: string[];
  backgroundRemovedUrl?: string;
  videoResults?: any[];
  stitchedVideo?: any;
  // Add other response fields as needed
}

interface RemoveBackgroundResponse {
  background_removed_url: string;
}

interface MultiKlingResponse {
  status: string;
  results: {
    prompt: string;
    status: string;
    result?: any;
    error?: string;
  }[];
}

export async function generateAdventure(
  prompt: string,
  imageUrl?: string
): Promise<GenerateResponse> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
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
    let videoResults = undefined;
    
    if (removeBackgroundPromise) {
      if (!results[1].ok) {
        console.error(`Remove background API error: ${results[1].status}`);
      } else {
        const backgroundData: RemoveBackgroundResponse = await results[1].json();
        backgroundRemovedUrl = backgroundData.background_removed_url;
        
        // If we have background removed image, call the generate-multiple-kling-videos endpoint
        if (backgroundRemovedUrl && scenesData.scenes) {
          try {
            // Extract scene values and prepare prompts array
            const scenePrompts = Object.values(scenesData.scenes);
            
            // Call generate-multiple-kling-videos API
            const klingResponse = await fetch(`${API_URL}/generate-multiple-kling-videos/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompts: scenePrompts,
                image_url: backgroundRemovedUrl,
              }),
            });
            
            if (klingResponse.ok) {
              const klingData: MultiKlingResponse = await klingResponse.json();
              videoResults = klingData.results;
              
              // Extract video URLs from the results
              const videoUrls = klingData.results
                .filter(result => result.status === "processing" && result.result?.video?.url)
                .map(result => result.result.video.url);
              
              // Call stitch-scenes endpoint if we have videos to stitch
              if (videoUrls.length > 0) {
                try {
                  const stitchResponse = await fetch(`${API_URL}/stitch-scenes/`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      scenes: videoUrls
                    }),
                  });
                  
                  if (stitchResponse.ok) {
                    const stitchData = await stitchResponse.json();
                    // Add stitched video URL to the response
                    return {
                      scenes: scenesData.scenes,
                      backgroundRemovedUrl,
                      videoResults,
                      stitchedVideo: stitchData
                    };
                  } else {
                    console.error(`Stitch scenes API error: ${stitchResponse.status}`);
                  }
                } catch (error) {
                  console.error('Error stitching videos:', error);
                }
              }
            } else {
              console.error(`Generate multiple kling videos API error: ${klingResponse.status}`);
            }
          } catch (error) {
            console.error('Error generating kling videos:', error);
          }
        }
      }
    }
    
    // Combine results
    return {
      scenes: scenesData.scenes,
      backgroundRemovedUrl,
      videoResults,
      stitchedVideo: undefined
    };
  } catch (error) {
    console.error('Error generating adventure:', error);
    throw error;
  }
}