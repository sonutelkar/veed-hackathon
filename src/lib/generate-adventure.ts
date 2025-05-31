interface GenerateRequest {
  prompt: string;
  imageUrl?: string;
}

interface GenerateResponse {
  scenes: string[];
  // Add other response fields as needed
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
    const response = await fetch(`${API_URL}/generate-scenes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        imageUrl,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data: GenerateResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating adventure:', error);
    throw error;
  }
}
