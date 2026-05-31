import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Upload, FileText, Plus, LogOut, Trash2, Play, Scissors } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { env } from "../config/env";

import { convertPdfToImages } from "../utils/pdf";

const API_URL = env.API_URL;

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // 1. Render PDF pages to PNG Blobs client-side
      const imageBlobs = await convertPdfToImages(file);

      // 2. Build multipart form data
      const formData = new FormData();
      formData.append("pdf", file, file.name);

      imageBlobs.forEach((blob, index) => {
        const imageName = `${file.name.replace(/\.[^/.]+$/, "")}-page-${index + 1}.png`;
        formData.append("images", blob, imageName);
      });

      // 3. Upload to backend
      const { data } = await axios.post(
        `${API_URL}/documents/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      alert("Upload and conversion successful!");
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      alert(error.response?.data?.message || "Failed to process and upload file.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_URL}/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  const handleDelete = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <nav className="bg-white border-b border-slate-200/60 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Score-Slice</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 font-medium bg-slate-100 px-3 py-1.5 rounded-full">
            {user.name || user.email}
          </span>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Scores</h2>
          <label className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold py-2.5 px-5 rounded-xl flex items-center gap-2 cursor-pointer transition shadow-sm hover:shadow-md">
            <Plus size={18} strokeWidth={2.5} />
            <span>Upload Score</span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
            <p className="font-medium">Loading your scores...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {documents?.map((doc: any) => (
              <div
                key={doc.id}
                onClick={() => navigate(`/editor/${doc.id}`)}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              >
                <div className="aspect-[3/4] bg-slate-50 flex items-center justify-center border-b border-slate-100 relative overflow-hidden group">
                  {doc.pages?.[0]?.imageUrl ? (
                    <img
                      src={doc.pages[0].imageUrl.startsWith("http") ? doc.pages[0].imageUrl : `${API_URL}${doc.pages[0].imageUrl}`}
                      alt={doc.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <FileText size={48} className="text-slate-300 group-hover:text-primary-300 transition-colors" />
                  )}

                  {/* Action Overlay */}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-6 backdrop-blur-[2px]">
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/viewer/${doc.id}`); }}
                      className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition transform translate-y-4 group-hover:translate-y-0"
                    >
                      <Play size={18} className="fill-current" />
                      Practice
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/editor/${doc.id}`); }}
                      className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition transform translate-y-4 group-hover:translate-y-0 delay-75 backdrop-blur-md"
                    >
                      <Scissors size={18} />
                      Edit Slices
                    </button>
                  </div>
                </div>

                <div className="p-4 flex items-start justify-between bg-white relative z-10">
                  <div className="flex-1 overflow-hidden pr-2">
                    <h3 className="font-bold text-slate-800 truncate" title={doc.title}>
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                      <FileText size={12} className="text-slate-400" />
                      {doc.pages?.length || 0} Pages
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, doc.id, doc.title)}
                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete score"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {documents?.length === 0 && (
              <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-3xl py-24 flex flex-col items-center text-slate-400">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <Upload size={32} className="text-slate-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No scores yet</h3>
                <p className="font-medium text-slate-500 max-w-sm text-center">
                  Upload your first PDF music score to begin slicing and annotating your practice sessions.
                </p>
                <label className="mt-8 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-6 rounded-xl cursor-pointer transition">
                  Browse Files
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            )}
          </div>
        )}
      </main>

      {uploadMutation.isPending && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-50">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="font-semibold text-lg">Converting PDF and uploading...</p>
          <p className="text-sm text-slate-300 mt-1">This processes all pages inside your browser and uploads them directly.</p>
        </div>
      )}
    </div>
  );
}
