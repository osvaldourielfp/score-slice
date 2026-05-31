import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  Scissors,
  MessageSquare,
  Play,
  X,
  Send,
} from "lucide-react";
import { env } from "../config/env";

const API_URL = env.API_URL;

export default function Editor() {
  const { id: documentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");
  const [currentPage, setCurrentPage] = useState(0);
  const [selection, setSelection] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      const { data } = await axios.get(
        `${API_URL}/slices/sessions/${documentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return data;
    },
  });

  const page = document?.pages?.[currentPage];
  const session = sessions?.[0];

  const { data: comments } = useQuery({
    queryKey: ["comments", page?.id, selectedSliceId],
    queryFn: async () => {
      if (!page?.id) return [];
      const { data } = await axios.get(`${API_URL}/comments`, {
        params: { pageId: page.id, sliceId: selectedSliceId },
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
    enabled: !!page?.id,
  });

  const saveSliceMutation = useMutation({
    mutationFn: async (slice: any) => {
      await axios.post(`${API_URL}/slices`, slice, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", documentId] });
      setSelection(null);
    },
  });

  const deleteSliceMutation = useMutation({
    mutationFn: async (sliceId: string) => {
      await axios.delete(`${API_URL}/slices/${sliceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: (_, sliceId) => {
      queryClient.invalidateQueries({ queryKey: ["sessions", documentId] });
      if (selectedSliceId === sliceId) setSelectedSliceId(null);
    },
  });


  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await axios.post(
        `${API_URL}/comments`,
        {
          content,
          pageId: page.id,
          sliceId: selectedSliceId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      setCommentText("");
    },
  });

  useEffect(() => {
    if (!page) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = page.imageUrl.startsWith("http") ? page.imageUrl : `${API_URL}${page.imageUrl}`;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      draw(ctx, img);
    };
  }, [page, selection, sessions, selectedSliceId]);

  const draw = (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0);

    const currentSlices =
      session?.slices?.filter((s: any) => s.pageId === page?.id) || [];
    currentSlices.forEach((s: any) => {
      const isSelected = selectedSliceId === s.id;
      ctx.strokeStyle = isSelected ? "#f59e0b" : "#0ea5e9";
      ctx.lineWidth = isSelected ? 6 : 4;
      ctx.setLineDash(isSelected ? [] : [10, 5]);
      ctx.strokeRect(s.x, s.y, s.width, s.height);
      ctx.fillStyle = isSelected
        ? "rgba(245, 158, 11, 0.2)"
        : "rgba(14, 165, 233, 0.1)";
      ctx.fillRect(s.x, s.y, s.width, s.height);
    });

    if (selection) {
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 4;
      ctx.setLineDash([]);
      ctx.strokeRect(
        selection.x,
        selection.y,
        selection.width,
        selection.height,
      );
      ctx.fillStyle = "rgba(244, 63, 94, 0.2)";
      ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
    }
  };

  const saveSlice = () => {
    if (!selection || !page || !session) return;

    // Normalize: Ensure width and height are positive
    const normalized = {
      x: selection.width < 0 ? selection.x + selection.width : selection.x,
      y: selection.height < 0 ? selection.y + selection.height : selection.y,
      width: Math.abs(selection.width),
      height: Math.abs(selection.height),
    };

    // Only save if it has some size
    if (normalized.width < 5 || normalized.height < 5) {
      setSelection(null);
      return;
    }

    saveSliceMutation.mutate({
      ...normalized,
      pageId: page.id,
      sessionId: session.id,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = canvasRef.current!.width / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;

    // Check if clicked on an existing slice (with improved hit detection)
    const currentSlices =
      session?.slices?.filter((s: any) => s.pageId === page?.id) || [];
    
    // Check slices in reverse order (top-most first)
    const clickedSlice = [...currentSlices].reverse().find((s: any) => {
      // Handle both normalized and un-normalized (legacy) slices
      const minX = Math.min(s.x, s.x + s.width);
      const maxX = Math.max(s.x, s.x + s.width);
      const minY = Math.min(s.y, s.y + s.height);
      const maxY = Math.max(s.y, s.y + s.height);
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    });

    if (clickedSlice) {
      setSelectedSliceId(clickedSlice.id);
      setSelection(null);
    } else {
      setSelectedSliceId(null);
      setSelection({ x, y, width: 0, height: 0 });
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !selection) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = canvasRef.current!.width / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    setSelection({
      ...selection,
      width: x - selection.x,
      height: y - selection.y,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <header className="bg-white border-b border-slate-200/60 px-6 py-3 flex items-center justify-between z-10 shadow-sm relative">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-900"
            title="Back to Dashboard"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <h1 className="text-lg font-bold text-slate-900 truncate max-w-md">
            {document?.title}
          </h1>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
          <span className="text-sm font-bold text-slate-500 px-3 tracking-wide uppercase">
            Page {currentPage + 1} / {document?.pages?.length}
          </span>
          <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-slate-200/50 p-1">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-600 rounded-lg transition"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <div className="w-px h-4 bg-slate-200"></div>
            <button
              disabled={currentPage === (document?.pages?.length || 0) - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-600 rounded-lg transition"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
          <button
            onClick={() => navigate(`/viewer/${documentId}`)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition active:scale-95 border border-slate-200"
            title="Start from the very beginning"
          >
            <Play size={16} className="fill-current text-slate-500" />
            <span>Da Capo</span>
          </button>
          
          <button
            onClick={() => navigate(`/viewer/${documentId}?pageId=${page.id}`)}
            className="bg-slate-900 hover:bg-black text-white font-bold py-2 px-5 rounded-xl flex items-center gap-2 transition shadow-lg active:scale-95"
            title="Start practice from this page"
          >
            <Play size={18} className="fill-current text-primary-400" />
            <span>Practice Current Page</span>
          </button>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <button
            onClick={saveSlice}
            disabled={!selection}
            className="ml-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 transition shadow-sm disabled:shadow-none"
          >
            <Save size={18} strokeWidth={2.5} />
            <span>Save Slice</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex relative">
        <div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-100/50 relative"
          style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          <div className="bg-white shadow-2xl relative self-start border border-slate-200 ring-4 ring-white rounded-sm overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={() => setIsDrawing(false)}
              className="cursor-crosshair h-auto shadow-sm"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>
        </div>

        <aside className="w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10 relative">
          <div className="p-6 border-b border-slate-100 bg-white z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5 text-slate-900">
                <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                  <Scissors size={18} strokeWidth={2.5} />
                </div>
                <h2 className="text-lg font-black tracking-tight">Annotations</h2>
              </div>
              {selectedSliceId && (
                <button
                  onClick={() => setSelectedSliceId(null)}
                  className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition"
                  title="Clear selection"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[30vh] overflow-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {session?.slices
                ?.filter((s: any) => s.pageId === page?.id)
                .map((s: any, idx: number) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSliceId(s.id)}
                    className={`group border-2 rounded-xl p-3 cursor-pointer transition-all duration-200 ${selectedSliceId === s.id
                      ? "border-amber-400 bg-amber-50/50 shadow-sm"
                      : "border-slate-100 hover:border-primary-300 hover:bg-slate-50"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold uppercase tracking-wider ${selectedSliceId === s.id ? 'text-amber-700' : 'text-slate-500'}`}>
                        Slice #{idx + 1}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSliceMutation.mutate(s.id);
                        }}
                        className={`p-1.5 rounded-md transition opacity-0 group-hover:opacity-100 ${selectedSliceId === s.id ? 'text-amber-600 hover:bg-amber-100' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              {(!session?.slices || session.slices.filter((s: any) => s.pageId === page?.id).length === 0) && (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 text-sm font-medium bg-slate-50/50">
                  Draw a rectangle on the score to create your first slice.
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-slate-50/80 overflow-hidden relative">
            <div className="p-6 pb-2">
              <div className="flex items-center gap-2.5 mb-2 text-slate-700">
                <MessageSquare size={16} strokeWidth={2.5} className={selectedSliceId ? 'text-amber-500' : 'text-primary-500'} />
                <h3 className="text-sm font-bold uppercase tracking-widest">
                  {selectedSliceId ? "Slice Notes" : "Page Notes"}
                </h3>
              </div>
            </div>

            <div className="flex-1 overflow-auto space-y-4 px-6 pb-4 scrollbar-thin scrollbar-thumb-slate-200">
              {comments?.map((c: any) => (
                <div
                  key={c.id}
                  className={`bg-white border p-4 rounded-2xl shadow-sm ${selectedSliceId ? 'border-amber-100' : 'border-slate-200'}`}
                >
                  <p className="text-sm text-slate-700 leading-relaxed">{c.content}</p>
                  <span className="text-[10px] font-medium text-slate-400 mt-3 block uppercase tracking-wider">
                    {new Date(c.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              ))}
              {comments?.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <MessageSquare size={32} strokeWidth={1} className="mx-auto mb-3 opacity-50" />
                  No notes yet.
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (commentText.trim()) addCommentMutation.mutate(commentText);
                }}
                className="relative"
              >
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pr-14 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none resize-none transition-all"
                  placeholder="Add a note..."
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="absolute bottom-3 right-3 p-2.5 bg-primary-600 text-white rounded-lg disabled:opacity-40 disabled:hover:bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
                >
                  <Send size={16} strokeWidth={2.5} />
                </button>
              </form>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
