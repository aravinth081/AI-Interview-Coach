'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mic, MicOff, 
  Video as VideoIcon, VideoOff, 
  MessageSquare, 
  BarChart2, 
  X, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InterviewRoom({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("Tell me about yourself and your background.");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [confidence, setConfidence] = useState(70);
  const [eyeContact, setEyeContact] = useState(false);
  const [emotion, setEmotion] = useState("Neutral");
  const [isInitializing, setIsInitializing] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Initialize camera and speech recognition
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initMedia() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 }, 
          audio: true 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsInitializing(false);
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setIsInitializing(false);
      }
    }

    // WebSocket Connection
    const token = localStorage.getItem('access_token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.hostname}:8000/api/v1/interviews/ws/${params.id}`);
    
    socket.onopen = () => {
      console.log("Connected to AI Interview Server");
      socket.send(JSON.stringify({ type: 'start_session' }));
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'evaluation') {
        setFeedback(message.data);
      }
    };

    socketRef.current = socket;

    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + event.results[i][0].transcript + ' ');
          } else {
            currentTranscript = event.results[i][0].transcript;
          }
        }
      };

      recognitionRef.current = recognition;
    }

    initMedia();

    // ML Behavioral Simulation
    const cvInterval = setInterval(() => {
      if (!isCameraOff && isRecording) {
        setEyeContact(Math.random() > 0.3);
        const emotions = ["Confident", "Thinking", "Neutral", "Engaged"];
        setEmotion(emotions[Math.floor(Math.random() * emotions.length)]);
        setConfidence(prev => Math.min(100, Math.max(40, prev + (Math.random() * 6 - 3))));
      }
    }, 2000);

    return () => {
      clearInterval(cvInterval);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [params.id, isCameraOff, isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) recognitionRef.current.stop();
      
      // Send real data to backend
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'end_answer',
          data: {
            transcript: transcript,
            question: currentQuestion
          }
        }));
      }
    } else {
      setTranscript("");
      setFeedback(null);
      setIsRecording(true);
      if (recognitionRef.current) recognitionRef.current.start();
    }
  };

  const handleFinishSession = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'complete_interview' }));
    }
    router.push('/dashboard');
  };

  if (isInitializing) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white font-sans">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-zinc-500 font-medium tracking-wide">Initializing AI Systems...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Sidebar - AI Feedback */}
      <aside className="w-80 border-r border-zinc-800 flex flex-col bg-[#09090b] z-10 shadow-2xl">
        <div className="p-6 border-b border-zinc-800 bg-[#0c0c0e]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-bold flex items-center gap-2 text-sm tracking-tight">
              <Zap size={18} className="text-blue-500 fill-blue-500/20" /> Real-time Analytics
            </h2>
            <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black rounded uppercase tracking-widest">
              Live AI
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between text-[10px] text-zinc-500 mb-2 font-black uppercase tracking-[0.2em]">
                <span>Confidence Index</span>
                <span className={confidence > 70 ? 'text-emerald-500' : 'text-amber-500'}>{Math.round(confidence)}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  className={`h-full transition-all duration-700 ${
                    confidence > 75 ? 'bg-gradient-to-r from-blue-500 to-emerald-500' : 
                    confidence > 45 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-red-500'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <AnalyticsCard label="Pace" value={isRecording ? "138 WPM" : feedback?.wpm ? `${feedback.wpm} WPM` : "-"} />
              <AnalyticsCard label="Fillers" value={isRecording ? "1" : feedback?.fillers ?? "-"} color="text-amber-500" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <AnimatePresence mode="wait">
            {feedback ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-5 p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl shadow-inner">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                    {feedback.overall_score}
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">AI Evaluation</div>
                    <div className="text-sm font-bold text-blue-100">Ready for Next Round</div>
                  </div>
                </div>

                <FeedbackSection 
                  title="Core Strengths" 
                  items={feedback.strengths} 
                  icon={<CheckCircle2 size={16} className="text-emerald-500" />} 
                />

                <FeedbackSection 
                  title="Growth Areas" 
                  items={feedback.improvements} 
                  icon={<AlertCircle size={16} className="text-amber-500" />} 
                />
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900 flex items-center justify-center mb-6 text-zinc-700 shadow-xl border border-white/5">
                  <BarChart2 size={32} />
                </div>
                <h3 className="text-sm font-bold text-zinc-400 mb-2 tracking-tight">AI Listening...</h3>
                <p className="text-xs text-zinc-600 leading-relaxed font-medium">Start your response to generate deep behavioral and content analytics.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Content - Video */}
      <main className="flex-1 flex flex-col relative bg-[#060608]">
        {/* Top Header */}
        <div className="absolute top-0 inset-x-0 p-8 flex justify-between items-start z-20">
          <div className="glass-card py-4 px-6 max-w-xl backdrop-blur-3xl border border-white/10 shadow-2xl">
            <div className="flex items-center gap-2 text-[10px] text-blue-500 font-black uppercase tracking-[0.25em] mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
              Interview Phase: Technical
            </div>
            <h1 className="text-xl font-bold tracking-tight leading-snug">{currentQuestion}</h1>
          </div>
          <button 
            onClick={handleFinishSession}
            className="w-12 h-12 bg-zinc-900/50 backdrop-blur-2xl hover:bg-red-500/20 text-zinc-500 hover:text-red-500 transition-all rounded-2xl border border-white/5 flex items-center justify-center shadow-2xl"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Feed Area */}
        <div className="flex-1 flex items-center justify-center p-10 pt-36 pb-40">
          <div className="relative w-full h-full max-w-6xl rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] bg-zinc-950 group">
            {isCameraOff ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">
                <div className="w-28 h-28 rounded-full bg-zinc-900 flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
                  <VideoOff size={44} className="text-zinc-700" />
                </div>
                <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs">Video Feed Inactive</p>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover scale-x-[-1] opacity-90 transition-opacity duration-700"
                />
                
                <div className="absolute inset-0 pointer-events-none p-10">
                  <div className="flex flex-col gap-4">
                    <motion.div 
                      animate={{ scale: eyeContact ? 1.05 : 1 }}
                      className={`inline-flex items-center gap-3 px-5 py-2.5 bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-[0.15em] self-start shadow-2xl ${eyeContact ? 'text-emerald-400' : 'text-zinc-500'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${eyeContact ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 'bg-zinc-700'}`}></span>
                      Eye Contact: {eyeContact ? 'Optimized' : 'Improving'}
                    </motion.div>
                    
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-[0.15em] self-start shadow-2xl">
                      <span className="text-zinc-500">Emotion:</span>
                      <span className="text-blue-400 font-black">{emotion}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <AnimatePresence>
              {isRecording && (
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  className="absolute bottom-10 inset-x-10 px-10 py-6 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] text-center shadow-3xl"
                >
                  <p className="text-zinc-200 text-base font-semibold italic leading-relaxed tracking-wide">
                    {transcript ? `"${transcript}"` : "AI is analyzing your speech patterns..."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Dock Controls */}
        <div className="absolute bottom-0 inset-x-0 p-12 flex justify-center z-30">
          <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/10 p-3 rounded-[2.5rem] flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-1.5 ml-2">
              <ControlButton 
                active={!isMuted} 
                onClick={() => setIsMuted(!isMuted)} 
                icon={isMuted ? <MicOff size={22} /> : <Mic size={22} />} 
              />
              <ControlButton 
                active={!isCameraOff} 
                onClick={() => setIsCameraOff(!isCameraOff)} 
                icon={isCameraOff ? <VideoOff size={22} /> : <VideoIcon size={22} />} 
              />
            </div>
            
            <div className="w-[1px] h-10 bg-white/10 mx-1" />
            
            <button 
              onClick={toggleRecording}
              className={`flex items-center gap-4 px-12 py-5 rounded-3xl font-black uppercase tracking-[0.2em] transition-all duration-500 active:scale-95 shadow-3xl ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/40' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/40'
              }`}
            >
              {isRecording ? (
                <>
                  <div className="w-3 h-3 rounded-sm bg-white animate-pulse" />
                  Finish Answer
                </>
              ) : (
                <>
                  <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_12px_white] animate-ping" />
                  Start AI Session
                </>
              )}
            </button>

            <div className="w-[1px] h-10 bg-white/10 mx-1" />

            <div className="flex items-center gap-1.5 mr-2">
              <ControlButton icon={<MessageSquare size={22} />} />
              <ControlButton icon={<BarChart2 size={22} />} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function AnalyticsCard({ label, value, color = "text-white" }: { label: string, value: string, color?: string }) {
  return (
    <div className="p-4 bg-zinc-900/40 rounded-2xl border border-white/5 backdrop-blur-xl">
      <div className="text-[10px] text-zinc-500 mb-1.5 uppercase font-black tracking-widest">{label}</div>
      <div className={`text-sm font-black ${color}`}>{value}</div>
    </div>
  );
}

function FeedbackSection({ title, items, icon }: { title: string, items: string[], icon: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="text-xs text-zinc-300 bg-zinc-900/60 p-4 rounded-2xl border border-white/5 leading-relaxed font-medium shadow-xl"
          >
            {item}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ControlButton({ icon, onClick, active = false }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-14 h-14 rounded-2xl transition-all duration-300 flex items-center justify-center border ${
        active 
          ? 'bg-zinc-800 border-white/10 text-white shadow-xl' 
          : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
      }`}
    >
      {icon}
    </button>
  );
}
