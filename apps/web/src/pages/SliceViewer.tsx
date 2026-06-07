import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ChevronLeft, ChevronRight, MessageSquare, Play, X } from "lucide-react";
import { env } from "../config/env";

const API_URL = env.API_URL;

export default function SliceViewer() {
  const { id: documentId } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const token = localStorage.getItem("token");
  const [currentSliceIdx, setCurrentSliceIdx] = useState(0);
  const [showComments, setShowComments] = useState(() => {
    return localStorage.getItem("showComments") !== "false";
  });

  const handleToggleComments = (checked: boolean) => {
    setShowComments(checked);
    localStorage.setItem("showComments", String(checked));
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get startPage from URL params reactively
  const startPageId = useMemo(() => new URLSearchParams(search).get("pageId"), [search]);

  const { data: document } = useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.find((d: any) => d.id === documentId);
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions", documentId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/slices/sessions/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
  });

  const session = sessions?.[0];
  const allSlices = useMemo(() => {
    if (!session?.slices || !document?.pages) return [];
    // Sort slices by page number and then by Y coordinate
    return [...session.slices].sort((a: any, b: any) => {
      const pageA = document.pages.find((p: any) => p.id === a.pageId)?.pageNumber || 0;
      const pageB = document.pages.find((p: any) => p.id === b.pageId)?.pageNumber || 0;
      if (pageA !== pageB) return pageA - pageB;
      return a.y - b.y;
    });
  }, [session, document]);

  const currentSlice = allSlices[currentSliceIdx];
  
  // Set initial slice based on startPageId if provided
  useEffect(() => {
    if (startPageId && allSlices.length > 0) {
      const firstSliceOnPageIndex = allSlices.findIndex((s: any) => s.pageId === startPageId);
      if (firstSliceOnPageIndex !== -1) {
        setCurrentSliceIdx(firstSliceOnPageIndex);
      }
    }
  }, [startPageId, allSlices]);

  const currentPage = useMemo(() => {
    return document?.pages?.find((p: any) => p.id === currentSlice?.pageId);
  }, [document, currentSlice]);

  const { data: comments } = useQuery({
    queryKey: ["comments", currentSlice?.id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/comments`, {
        params: { sliceId: currentSlice.id },
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
    enabled: !!currentSlice?.id,
  });

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        setCurrentSliceIdx((prev) => Math.min(prev + 1, allSlices.length - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSliceIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        navigate(`/editor/${documentId}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [allSlices.length, documentId, navigate]);

  // Render the slice
  useEffect(() => {
    if (!currentSlice || !currentPage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = currentPage.imageUrl.startsWith("http") ? currentPage.imageUrl : `${API_URL}${currentPage.imageUrl}`;
    img.onload = () => {
      // Normalize dimensions for display
      const sourceX = currentSlice.width < 0 ? currentSlice.x + currentSlice.width : currentSlice.x;
      const sourceY = currentSlice.height < 0 ? currentSlice.y + currentSlice.height : currentSlice.y;
      const sourceW = Math.abs(currentSlice.width);
      const sourceH = Math.abs(currentSlice.height);

      canvas.width = sourceW;
      canvas.height = sourceH;

      // Draw only the slice part
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceW,
        sourceH,
        0,
        0,
        sourceW,
        sourceH
      );
    };
  }, [currentSlice, currentPage]);

  if (!allSlices.length && !sessions) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center animate-pulse">Loading Practice Mode...</div>
      </div>
    );
  }

  if (allSlices.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-10">
        <X className="w-16 h-16 text-slate-700 mb-6" />
        <h2 className="text-2xl font-bold mb-2">No slices found</h2>
        <p className="text-slate-400 mb-8">Go back to the editor and create some slices first.</p>
        <button
          onClick={() => navigate(`/editor/${documentId}`)}
          className="bg-white text-slate-900 font-bold py-3 px-8 rounded-2xl hover:bg-slate-200 transition"
        >
          Return to Editor
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden text-slate-100">
      {/* HUD Header */}
      <header className="px-8 py-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(`/editor/${documentId}`)}
            className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Play size={20} className="fill-current text-primary-500" />
              Practice Mode
            </h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              {document?.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-2xl">
          <button
            disabled={currentSliceIdx === 0}
            onClick={() => setCurrentSliceIdx(prev => prev - 1)}
            className="p-1 hover:text-primary-400 disabled:opacity-20 transition"
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
          <span className="text-sm font-black min-w-[80px] text-center tracking-tighter">
            SLICE {currentSliceIdx + 1} <span className="text-slate-600 font-medium">/ {allSlices.length}</span>
          </span>
          <button
            disabled={currentSliceIdx === allSlices.length - 1}
            onClick={() => setCurrentSliceIdx(prev => prev + 1)}
            className="p-1 hover:text-primary-400 disabled:opacity-20 transition"
          >
            <ChevronRight size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer select-none hover:text-white transition bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-2xl">
            <input
              type="checkbox"
              checked={showComments}
              onChange={(e) => handleToggleComments(e.target.checked)}
              className="rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-950 h-4 w-4"
            />
            <span>Show Notes</span>
          </label>
        </div>
      </header>

      {/* Main Viewport */}
      <div className={`flex-1 flex flex-col items-center justify-center p-12 pt-32 ${showComments ? "pb-40" : "pb-16"}`}>
        <div className="relative group max-w-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-amber-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white p-2 rounded-lg shadow-2xl shadow-primary-500/10">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto rounded-sm ring-1 ring-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Footer Comments Overlay */}
      {showComments && (
        <footer className="absolute bottom-0 left-0 right-0 p-8 flex justify-center z-20">
          <div className="max-w-2xl w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-slate-400">
              <MessageSquare size={18} strokeWidth={2.5} className="text-primary-500" />
              <h3 className="text-xs font-black uppercase tracking-widest">Slice Notes</h3>
            </div>
            <div className="space-y-3 max-h-24 overflow-auto scrollbar-hide">
              {comments?.map((c: any) => (
                <p key={c.id} className="text-sm text-slate-200 leading-relaxed font-medium bg-white/5 p-3 rounded-xl border border-white/5">
                  {c.content}
                </p>
              ))}
              {(!comments || comments.length === 0) && (
                <p className="text-sm text-slate-500 italic">No notes for this fragment.</p>
              )}
            </div>
          </div>
        </footer>
      )}

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(14,165,233,0.5)]"
          style={{ width: `${((currentSliceIdx + 1) / allSlices.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
