interface GenerateRequest {
  prompt: string;
  imageUrl?: string;
}

interface GenerateResponse {
  scenes: string[];
  backgroundRemovedUrl?: string;
  videoResults?: any[];
  stitchedVideo?: any;
  videoSummaries?: string[];
  script?: any;
  audioPath?: string;
  avatarVideo?: any;
  lipSyncVideo?: any;
  finalVideo?: any;
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

interface VideoSummaryResponse {
  summary: string;
}

interface ScriptResponse {
  script: Record<string, string>;
}

interface TTSResponse {
  audio_path: string;
}

interface AvatarVideoResponse {
  video_url?: string;
  status?: string;
  video?: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
  [key: string]: any;
}

interface LipSyncResponse {
  video_url?: string;
  status?: string;
  [key: string]: any;
}

interface VideoOverlayResponse {
  status: string;
  video_url: string;
  stored_url?: string;
}

export async function generateAdventure(
  prompt: string,
  imageUrl?: string,
  userId?: string
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
    let videoSummaries = undefined;
    
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
                  // First, make the stitch request
                  const stitchResponse = await fetch(`${API_URL}/stitch-scenes/`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      scenes: videoUrls
                    }),
                  });
                  
                  // Process stitch response
                  let stitchData;
                  if (stitchResponse.ok) {
                    stitchData = await stitchResponse.json();
                  } else {
                    console.error(`Stitch scenes API error: ${stitchResponse.status}`);
                  }
                  
                  // Create summary requests for each video
                  const summaryPromises = videoUrls.map(videoUrl => 
                    fetch(`${API_URL}/summary-of-videos/`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        video_url: videoUrl,
                        prompt: "Summarise the video as if you were a David Attenborough style wildlife presenter"
                      }),
                    })
                  );
                  
                  // Wait for all summary requests to complete
                  const summaryResponses = await Promise.all(summaryPromises);
                  
                  // Process all summary responses
                  const summaryDataPromises = summaryResponses.map(async (response, index) => {
                    if (response.ok) {
                      try {
                        const data: VideoSummaryResponse = await response.json();
                        return data.summary;
                      } catch (error) {
                        console.error(`Error parsing summary response for video ${index}: ${error}`);
                        return null;
                      }
                    } else {
                      console.error(`Video summary API error for video ${index}: ${response.status}`);
                      return null;
                    }
                  });
                  
                  const summaries = await Promise.all(summaryDataPromises);
                  videoSummaries = summaries.filter(summary => summary !== null) as string[];
                  
                  // Generate script using video summaries and scenes
                  let script: any = undefined;
                  let audioPath: string | undefined = undefined;
                  let avatarVideo: any = undefined;
                  let lipSyncResult: any = undefined;
                  
                  if (videoSummaries.length > 0) {
                    try {
                      // Create scenes object with keys in format "scene1", "scene2", etc.
                      const scenesObj: Record<string, string> = {};
                      Object.values(scenesData.scenes).forEach((scene, index) => {
                        scenesObj[`scene${index + 1}`] = scene as string;
                      });
                      
                      const scriptResponse = await fetch(`${API_URL}/generate-script/`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          video_summaries: videoSummaries,
                          scenes: scenesObj
                        }),
                      });
                      
                      if (scriptResponse.ok) {
                        const responseData = await scriptResponse.json();
                        // Store the script object
                        script = responseData.script;
                        
                        // Generate text-to-speech from script
                        if (script) {
                          try {
                            // Concatenate all script scenes into a single text
                            const scriptText = Object.values(script).join(' ');
                            
                            // First generate TTS, then use that for the avatar video
                            const ttsResponse = await fetch(`${API_URL}/tts-from-script/`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                text: scriptText
                              }),
                            });
                            
                            // Process TTS response
                            let audioPathResult: string | undefined = undefined;
                            if (ttsResponse.ok) {
                              const ttsData: TTSResponse = await ttsResponse.json();
                              audioPathResult = ttsData.audio_path;
                              
                              // Only generate avatar video if we have audio
                              if (audioPathResult) {
                                // Call avatar video endpoint with the audio URL
                                const avatarResponse = await fetch(`${API_URL}/generate-avatar-video/`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    audio_url: audioPathResult
                                  }),
                                });
                                
                                // Process avatar video response
                                let avatarVideoResult: any = undefined;
                                if (avatarResponse.ok) {
                                  avatarVideoResult = await avatarResponse.json();
                                  
                                  // Update variables with the results
                                  audioPath = audioPathResult;
                                  avatarVideo = avatarVideoResult;
                                  
                                  // If we have both audio and avatar video, create lip sync
                                  if (audioPathResult && avatarVideoResult?.video?.url) {
                                    try {
                                      // Call lip sync endpoint
                                      const lipSyncResponse = await fetch(`${API_URL}/lip-sync-video-audio/`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          video_url: avatarVideoResult.video.url,
                                          audio_url: audioPathResult
                                        }),
                                      });
                                      
                                      if (lipSyncResponse.ok) {
                                        lipSyncResult = await lipSyncResponse.json();
                                        
                                        // If we have both the stitched video and lip sync video, call final-overlay
                                        if (stitchData?.url && lipSyncResult?.video_url) {
                                          try {
                                            // Call final-overlay endpoint
                                            const finalOverlayResponse = await fetch(`${API_URL}/final-overlay`, {
                                              method: 'POST',
                                              headers: {
                                                'Content-Type': 'application/json',
                                              },
                                              body: JSON.stringify({
                                                background_url: stitchData.url,
                                                overlay_url: lipSyncResult.video_url
                                              }),
                                            });
                                            
                                            let finalVideo = undefined;
                                            if (finalOverlayResponse.ok) {
                                              const finalOverlayData: VideoOverlayResponse = await finalOverlayResponse.json();
                                              finalVideo = finalOverlayData;
                                              
                                              // If userId is provided, store the video in Supabase
                                              if (userId && finalOverlayData.video_url) {
                                                try {
                                                  // Import supabase browser client dynamically
                                                  const { supabaseBrowser } = await import('./supabase-browser');
                                                  const supabase = supabaseBrowser();
                                                  
                                                  // Download the video
                                                  const videoResponse = await fetch(finalOverlayData.video_url);
                                                  
                                                  if (!videoResponse.ok) {
                                                    throw new Error(`Failed to download final video: ${videoResponse.status}`);
                                                  }
                                                  
                                                  const videoBlob = await videoResponse.blob();
                                                  
                                                  // Generate a unique filename
                                                  const timestamp = new Date().getTime();
                                                  const filename = `adventure_${timestamp}.mp4`;
                                                  const filePath = `${userId}/${filename}`;
                                                  
                                                  // Upload to Supabase storage
                                                  const { data, error } = await supabase.storage
                                                    .from('videos')
                                                    .upload(filePath, videoBlob, {
                                                      contentType: 'video/mp4',
                                                      cacheControl: '3600',
                                                    });
                                                    
                                                  if (error) {
                                                    console.error('Error uploading final video to Supabase:', error);
                                                  } else {
                                                    // Get the public URL
                                                    const { data: { publicUrl } } = supabase.storage
                                                      .from('videos')
                                                      .getPublicUrl(filePath);
                                                      
                                                    // Update finalVideo with the stored URL
                                                    finalVideo = {
                                                      ...finalOverlayData,
                                                      stored_url: publicUrl
                                                    };
                                                  }
                                                } catch (uploadError) {
                                                  console.error('Error storing final video in Supabase:', uploadError);
                                                }
                                              }
                                            } else {
                                              console.error(`Final overlay API error: ${finalOverlayResponse.status}`);
                                            }
                                            
                                            // Return complete response with final video
                                            return {
                                              scenes: scenesData.scenes,
                                              backgroundRemovedUrl,
                                              videoResults,
                                              stitchedVideo: stitchData,
                                              videoSummaries,
                                              script,
                                              audioPath,
                                              avatarVideo,
                                              lipSyncVideo: lipSyncResult,
                                              finalVideo
                                            };
                                          } catch (error) {
                                            console.error('Error generating final overlay:', error);
                                          }
                                        }
                                      } else {
                                        console.error(`Lip sync API error: ${lipSyncResponse.status}`);
                                      }
                                    } catch (error) {
                                      console.error('Error generating lip sync video:', error);
                                    }
                                  }
                                } else {
                                  console.error(`Avatar video API error: ${avatarResponse.status}`);
                                }
                              }
                            } else {
                              console.error(`TTS API error: ${ttsResponse.status}`);
                            }
                          } catch (error) {
                            console.error('Error generating media:', error);
                          }
                        }
                      } else {
                        console.error(`Generate script API error: ${scriptResponse.status}`);
                      }
                    } catch (error) {
                      console.error('Error generating script:', error);
                    }
                  }
                  
                  // Return complete response with all data
                  return {
                    scenes: scenesData.scenes,
                    backgroundRemovedUrl,
                    videoResults,
                    stitchedVideo: stitchData,
                    videoSummaries,
                    script,
                    audioPath,
                    avatarVideo,
                    lipSyncVideo: lipSyncResult,
                    finalVideo: undefined
                  };
                } catch (error) {
                  console.error('Error processing videos:', error);
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
      stitchedVideo: undefined,
      videoSummaries,
      script: undefined,
      audioPath: undefined,
      avatarVideo: undefined,
      lipSyncVideo: undefined,
      finalVideo: undefined
    };
  } catch (error) {
    console.error('Error generating adventure:', error);
    throw error;
  }
}