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
  videoUrl?: string;
  error?: string;
}

export async function generateDuet(
  prompt: string,
  imageUrl1: string,
  imageUrl2: string,
  userId?: string
): Promise<GenerateDuetResponse> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  if (!API_URL) {
    throw new Error('API URL not defined in environment variables');
  }

  try {
    // Call the kling-duet endpoint directly with the provided images
    const duetResponse = await fetch(`${API_URL}/generate-kling-duet/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_url_1: imageUrl1,
        image_url_2: imageUrl2,
      }),
    });
    
    if (!duetResponse.ok) {
      const errorText = await duetResponse.text();
      throw new Error(`Duet generation API error: ${duetResponse.status} - ${errorText}`);
    }
    
    const result = await duetResponse.json();
    
    // Check if video URL exists in the response
    let videoUrl = null;
    if (result.video && result.video.url) {
      videoUrl = result.video.url;
      
      // If userId is provided, we'll store the video in Supabase
      if (userId) {
        // Import supabase browser client dynamically to avoid server-side issues
        const { supabaseBrowser } = await import('./supabase-browser');
        const supabase = supabaseBrowser();
        
        try {
          // Download the video
          const videoResponse = await fetch(result.video.url);
          
          if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.status}`);
          }
          
          const videoBlob = await videoResponse.blob();
          
          // Generate a unique filename
          const timestamp = new Date().getTime();
          const filename = `duet_${timestamp}.mp4`;
          const filePath = `${userId}/${filename}`;
          
          // Upload to Supabase storage
          const { data, error } = await supabase.storage
            .from('videos')
            .upload(filePath, videoBlob, {
              contentType: 'video/mp4',
              cacheControl: '3600',
            });
            
          if (error) {
            console.error('Error uploading video to Supabase:', error);
          } else {
            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
              .from('videos')
              .getPublicUrl(filePath);
              
            videoUrl = publicUrl;
          }
        } catch (uploadError) {
          console.error('Error processing video for storage:', uploadError);
        }
      }
    }
    
    return {
      status: 'success',
      result,
      videoUrl,
    };
    
  } catch (error) {
    console.error('Error generating duet:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 