'use client'
import React, { useState, useRef } from 'react';
import { FileText, Upload, MessageSquare, Bot, Loader2, Sparkles, Book, Send, Minimize2, Maximize2, X, LayoutList } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as pdfjsLib from 'pdfjs-dist';
import { GoogleGenerativeAI } from '@google/generative-ai';

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

function InputContainer() {
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);
  const [pdfText, setPdfText] = useState('');
  const [isUploadMinimized, setIsUploadMinimized] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const chatSessionRef = useRef(null);

  async function initializeChatSession() {
    const apikey = "AIzaSyD-vV69glRGdbKu6SV5OVopDzi6I1IYF9s";
    const genAi = new GoogleGenerativeAI(apikey);
    const model = genAi.getGenerativeModel({ model: "gemini-2.0-flash" });

    const generationConfig = {
      temperature: 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    };

    chatSessionRef.current = model.startChat({ generationConfig });
    return chatSessionRef.current;
  }

  async function askGemini(text, context) {
    if (!chatSessionRef.current) {
      await initializeChatSession();
    }

    const prompt = context ? 
      `Context from PDF: ${context}\n\nQuestion: ${text}` :
      `Please provide a clear and structured summary of the following text, including:
      1. Main points and key takeaways
      2. Important details and findings
      3. Any significant conclusions or recommendations
      
      Text to summarize:
      ${text}
      
      Please format the response with clear headings, bullet points, and proper markdown formatting for better readability.`;
    
    const result = await chatSessionRef.current.sendMessage(prompt);
    return result.response.text();
  }

  const onFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const data = e.target?.result;
      setFileData(data);
    };
    fileReader.readAsArrayBuffer(selectedFile);
    
    setSummary('');
    setChat([]);
    setPdfText('');
    setShowSummary(false);
    chatSessionRef.current = null; // Reset chat session when new file is uploaded
  };

  const handleFile = async () => {
    if (!fileData) return;
    setLoading(true);
    setSummary('');

    try {
      const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;
      const page = await pdf.getPage(1);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(' ');
      setPdfText(text);
      
      const summary = await askGemini(text);
      setSummary(summary);
      setShowSummary(true);
    } catch (error) {
      console.error("Error processing PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestion = async () => {
    if (!question.trim() || !pdfText) return;

    setChat(prev => [...prev, { role: 'user', content: question }]);
    setQuestion('');
    setLoading(true);

    try {
      const answer = await askGemini(question, pdfText);
      setChat(prev => [...prev, { role: 'bot', content: answer }]);
    } catch (error) {
      console.error("Error getting answer:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetFile = () => {
    setFile(null);
    setFileData(null);
    setSummary('');
    setChat([]);
    setPdfText('');
    setShowSummary(false);
    setIsUploadMinimized(false);
    chatSessionRef.current = null; // Reset chat session when file is reset
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Neon Header */}
      <header className="bg-black/50 border-b border-cyan-500 neon-border">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Book className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400" />
              <h1 className="text-xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 neon-text">
                PDF Insight AI
              </h1>
            </div>
            {file && (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="hidden sm:flex items-center space-x-2 text-cyan-100">
                  <FileText className="h-5 w-5 text-cyan-400" />
                  <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                </div>
                <button
                  onClick={resetFile}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors duration-300"
                  title="Change PDF"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto px-4 py-4 sm:py-8 sm:px-6 lg:px-8 flex flex-col">
        <div className="flex-1 flex flex-col min-h-0 max-w-7xl mx-auto w-full">
          <div className="relative flex-1">
            {/* Upload Section - Minimizable */}
            <div className={`transition-all duration-300 ${file ? (isUploadMinimized ? 'absolute top-0 right-0 z-10 w-auto' : 'w-full mb-4 sm:mb-8') : 'w-full'}`}>
              {!file ? (
                <div className="bg-black/50 rounded-xl sm:rounded-2xl border border-cyan-500 p-4 sm:p-8 transition-all duration-300 hover:border-purple-500 neon-border">
                  <div className="flex items-center justify-center w-full">
                    <label className="group flex flex-col items-center justify-center w-full h-48 sm:h-72 border-2 border-cyan-500/30 border-dashed rounded-xl sm:rounded-2xl cursor-pointer bg-black/40 hover:bg-black/60 transition-all duration-300">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="relative">
                          <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                          <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400 absolute -top-2 -right-2 animate-pulse" />
                        </div>
                        <p className="mb-2 text-base sm:text-lg text-cyan-100 neon-text">
                          <span className="font-semibold">Drop your PDF here</span>
                        </p>
                        <p className="text-xs sm:text-sm text-cyan-300/70">or click to browse</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf"
                        onChange={onFileChange}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className={`bg-black/50 rounded-xl sm:rounded-2xl border border-cyan-500 ${isUploadMinimized ? 'p-2 sm:p-4' : 'p-4 sm:p-8'} transition-all duration-300 hover:border-purple-500 neon-border`}>
                  <div className="flex items-center justify-between">
                    {!isUploadMinimized && (
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-cyan-400" />
                        <span className="text-cyan-100 font-medium truncate max-w-[150px] sm:max-w-[300px]">{file.name}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <button
                        onClick={handleFile}
                        disabled={loading}
                        className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 border border-transparent text-sm font-medium rounded-lg sm:rounded-xl text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed neon-border"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <span className="flex items-center">
                            <Sparkles className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Analyze</span>
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setIsUploadMinimized(!isUploadMinimized)}
                        className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors duration-300"
                      >
                        {isUploadMinimized ? <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" /> : <Minimize2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Summary and Chat Container */}
            {file && (
              <div className="flex-1 min-h-0 bg-black/50 rounded-xl sm:rounded-2xl border border-cyan-500 p-4 sm:p-8 flex flex-col neon-border">
                {/* Summary Toggle */}
                {summary && (
                  <div className="mb-4 sm:mb-6">
                    <button
                      onClick={() => setShowSummary(!showSummary)}
                      className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-lg sm:rounded-xl text-cyan-400 hover:bg-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-300"
                    >
                      <LayoutList className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      {showSummary ? 'Hide Summary' : 'Show Summary'}
                    </button>
                    
                    {showSummary && (
                      <div className="mt-4 p-4 sm:p-6 bg-black/60 rounded-lg sm:rounded-xl border border-cyan-500/20 prose prose-invert max-w-none prose-sm sm:prose-base">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {summary}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}

                <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4 sm:mb-6 flex items-center neon-text">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-cyan-400" />
                  Ask Questions
                </h2>
                
                {/* Chat Messages */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 sm:space-y-4 mb-4 sm:mb-6 px-2 sm:px-4 custom-scrollbar">
                  {chat.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[90%] sm:max-w-[80%] rounded-xl sm:rounded-2xl p-3 sm:p-4 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white neon-border'
                            : 'bg-black/60 text-cyan-100 border border-cyan-500/20 neon-border'
                        }`}
                        style={{ minWidth: '160px', wordWrap: 'break-word', margin: '6px 0' }}
                      >
                        {message.role === 'bot' && (
                          <Bot className="h-4 w-4 sm:h-5 sm:w-5 mb-2 text-cyan-400" />
                        )}
                        <div className="prose prose-invert max-w-none prose-sm sm:prose-base">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-black/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-cyan-500/20 neon-border" style={{ margin: '6px 0' }}>
                        <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="border-t border-cyan-500/20 pt-4 sm:pt-6 mt-auto">
                  <div className="flex space-x-2 sm:space-x-4">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask anything about your PDF..."
                      className="flex-1 rounded-lg sm:rounded-xl bg-black/60 border border-cyan-500/20 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-cyan-100 placeholder-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent neon-border"
                      onKeyPress={(e) => e.key === 'Enter' && handleQuestion()}
                    />
                    <button
                      onClick={handleQuestion}
                      disabled={!question.trim() || loading}
                      className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm font-medium rounded-lg sm:rounded-xl text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed neon-border"
                    >
                      <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default InputContainer;