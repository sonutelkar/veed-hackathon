interface GenerateDuetRequest {
  prompt: string;
  imageUrl1: string;
  imageUrl2: string;
}

interface GenerateDuetResponse {
  status: string;
  result?: any;
  backgroundRemovedUrl1?: string;
  backgroundRemovedUrl2?: string;
  error?: string;
}

export async function generateDuet(
  prompt: string,
  imageUrl1: string,
  imageUrl2: string
): Promise<GenerateDuetResponse> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  if (!API_URL) {
    throw new Error('API URL not defined in environment variables');
  }

  try {
    // First remove backgrounds from both images
    const removeBackground1Promise = fetch(`${API_URL}/remove-background/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: imageUrl1,
      }),
    });
    
    const removeBackground2Promise = fetch(`${API_URL}/remove-background/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: imageUrl2,
      }),
    });
    
    // Wait for both background removal requests to complete
    const [bg1Response, bg2Response] = await Promise.all([
      removeBackground1Promise,
      removeBackground2Promise
    ]);
    
    if (!bg1Response.ok || !bg2Response.ok) {
      const errorText1 = bg1Response.ok ? "" : await bg1Response.text();
      const errorText2 = bg2Response.ok ? "" : await bg2Response.text();
      throw new Error(`Background removal failed: ${errorText1} ${errorText2}`);
    }
    
    const bg1Data = await bg1Response.json();
    const bg2Data = await bg2Response.json();
    
    const bgRemoved1 = bg1Data.background_removed_url;
    const bgRemoved2 = bg2Data.background_removed_url;
    
    if (!bgRemoved1 || !bgRemoved2) {
      throw new Error('Failed to get background-removed images');
    }
    
    // Now call the kling-duet endpoint with the background-removed images
    const duetResponse = await fetch(`${API_URL}/generate-kling-duet/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_url_1: bgRemoved1,
        image_url_2: bgRemoved2,
      }),
    });
    
    if (!duetResponse.ok) {
      const errorText = await duetResponse.text();
      throw new Error(`Duet generation API error: ${duetResponse.status} - ${errorText}`);
    }
    
    const result = await duetResponse.json();
    
    return {
      status: 'success',
      result,
      backgroundRemovedUrl1: bgRemoved1,
      backgroundRemovedUrl2: bgRemoved2
    };
    
  } catch (error) {
    console.error('Error generating duet:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 