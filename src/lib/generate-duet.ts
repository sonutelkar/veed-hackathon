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
    // Now call the kling-duet endpoint directly with the provided images
    const duetResponse = await fetch(`${API_URL}/generate-kling-duet/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_url_1: imageUrl1, // Use the original image URLs
        image_url_2: imageUrl2,
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
      // No backgroundRemovedUrl fields needed anymore
    };
    
  } catch (error) {
    console.error('Error generating duet:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 