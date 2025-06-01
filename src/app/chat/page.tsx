"use client";

import { useRef, useState, useEffect } from "react";
import { fal } from "@fal-ai/client";
import * as elevenlabs from "elevenlabs";

// Constants
const PET_IMAGE_URL = "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=1374&auto=format&fit=crop"; // Default cute dog image
const DEFAULT_PET_RESPONSE = "Woof! I'm so happy to see you! Talk to me!";

export default function ChatPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [petResponses, setPetResponses] = useState<string[]>([DEFAULT_PET_RESPONSE]);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const falSessionRef = useRef<any>(null);
  const elevenlabsClientRef = useRef<any>(null);
  
  // Handle video results from fal.ai
  const handleVideoResult = (result: any) => {
    if (result.video?.url) {
      setCurrentVideoUrl(result.video.url);
      setIsProcessing(false);
      
      // Play the video when it's available
      if (videoRef.current) {
        videoRef.current.src = result.video.url;
        videoRef.current.play().catch(err => console.error("Error playing video:", err));
      }
    }
  };
  
  // Initialize fal.ai and ElevenLabs clients
  useEffect(() => {
    // Initialize Fal.ai client
    fal.config({
      credentials: process.env.NEXT_PUBLIC_FAL_KEY || "fal_key_here",
    });
    
    // Create a subscription to the lip sync model
    falSessionRef.current = fal.subscribe("fal-ai/sync-lipsync/v2", {
      input: { 
        image_url: PET_IMAGE_URL,
      },
      onResult: handleVideoResult,
      onError: (error: Error) => console.error("Fal.ai error:", error),
    });
    
    // Initialize ElevenLabs client
    elevenlabsClientRef.current = new elevenlabs.VoiceClient({
      apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_KEY || "elevenlabs_key_here",
    });
    
    setIsInitialized(true);
    
    // Cleanup function
    return () => {
      if (falSessionRef.current) {
        falSessionRef.current.unsubscribe();
      }
    };
  }, []);
  
  // Start recording audio
  const startRecording = async () => {
    try {
      setIsRecording(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        await processAudioInput(audioBlob);
        
        // Stop all tracks in the stream to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
    } catch (err) {
      console.error("Error starting recording:", err);
      setIsRecording(false);
    }
  };
  
  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    setIsRecording(false);
  };
  
  // Process the recorded audio
  const processAudioInput = async (audioBlob: Blob) => {
    if (!falSessionRef.current) return;
    
    try {
      setIsProcessing(true);
      
      // For a real app, you would send this audio to a speech-to-text service
      // and then generate a response with a language model
      
      // For demo purposes, we'll use hardcoded responses
      const petResponses = [
        "I love you too! Can we go for a walk?",
        "Woof! That sounds exciting! Tell me more!",
        "Are we going to play fetch later? I hope so!",
        "I've been waiting for you all day! I'm so happy!",
        "Do you have treats? I love treats!",
      ];
      
      const randomResponse = petResponses[Math.floor(Math.random() * petResponses.length)];
      setPetResponses(prev => [...prev, randomResponse]);
      
      // Generate audio from text using ElevenLabs
      if (elevenlabsClientRef.current) {
        try {
          // Use ElevenLabs to convert text to speech
          const audio = await elevenlabsClientRef.current.generate({
            voice: "Adam", // Using a standard voice name
            text: randomResponse,
            model_id: "eleven_monolingual_v1",
          });
          
          // Convert ArrayBuffer to Blob
          const audioBlob = new Blob([audio], { type: "audio/mpeg" });
          
          // Create URL for the audio blob
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Send the audio URL to fal.ai for lip syncing
          falSessionRef.current.send({ audio_url: audioUrl });
        } catch (error) {
          console.error("ElevenLabs error:", error);
          
          // Fallback: Send the audio blob directly if ElevenLabs fails
          const audioUrl = URL.createObjectURL(audioBlob);
          falSessionRef.current.send({ audio_url: audioUrl });
        }
      } else {
        // Fallback: Send the audio blob directly if ElevenLabs isn't available
        const audioUrl = URL.createObjectURL(audioBlob);
        falSessionRef.current.send({ audio_url: audioUrl });
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 bg-blue-500 text-white font-bold text-lg">
          Chat with Your Pet
        </div>
        
        <div className="p-4 flex flex-col items-center">
          {/* Pet video display */}
          <div className="w-64 h-64 rounded-full overflow-hidden bg-gray-200 mb-4 relative">
            {currentVideoUrl ? (
              <video 
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted={false}
              />
            ) : (
              <img 
                src={PET_IMAGE_URL} 
                alt="Your pet" 
                className="w-full h-full object-cover"
              />
            )}
            
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          
          {/* Pet response */}
          <div className="w-full bg-blue-100 p-3 rounded-lg mb-4 text-center">
            <p>{petResponses[petResponses.length - 1]}</p>
          </div>
          
          {/* Recording button */}
          <button
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
              isRecording ? "bg-red-500 scale-110" : "bg-blue-500"
            } ${!isInitialized || isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={!isInitialized || isProcessing}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </button>
          
          <p className="mt-4 text-sm text-gray-500">
            {isRecording ? "Release to send" : "Hold to talk to your pet"}
          </p>
        </div>
        
        <div className="p-4 bg-gray-100 text-xs text-gray-500">
          Note: You'll need to provide FAL.ai and ElevenLabs API keys in your environment variables 
          (NEXT_PUBLIC_FAL_KEY and NEXT_PUBLIC_ELEVENLABS_KEY)
        </div>
      </div>
    </div>
  );
}
