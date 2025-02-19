'use client'
import React, { useState } from 'react';
import { FileText, Upload, MessageSquare, Bot, Loader2, Sparkles, Book, Send } from 'lucide-react';
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

  async function askGemini(text, context) {
    const apikey = "AIzaSyD-vV69glRGdbKu6SV5OVopDzi6I1IYF9s";
    const genAi = new GoogleGenerativeAI(apikey);
    const model = genAi.getGenerativeModel({ model: "gemini-2.0-flash" });

    const generationConfig = {
      temperature: 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    };

    const chatSession = model.startChat({ generationConfig });
    const prompt = context ? 
      `Context from PDF: ${context}\n\nQuestion: ${text}` :
      `Please provide a clear and structured summary of the following text, including:
      1. Main points and key takeaways
      2. Important details and findings
      3. Any significant conclusions or recommendations
      
      Text to summarize:
      ${text}
      
      Please format the response with clear headings, bullet points, and proper markdown formatting for better readability.`;
    
    const result = await chatSession.sendMessage(prompt);
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

  return (
    <div className="min-h-screen bg-black">
      {/* Neon Header */}
      <header className="bg-black/50 border-b border-cyan-500 neon-border">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <Book className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 neon-text">
              PDF Insight AI
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - PDF Upload and Summary */}
          <div className="space-y-8">
            {/* File Upload Section */}
            <div className="bg-black/50 rounded-2xl border border-cyan-500 p-8 transition-all duration-300 hover:border-purple-500 neon-border">
              <div className="space-y-6">
                <div className="flex items-center justify-center w-full">
                  <label className="group flex flex-col items-center justify-center w-full h-72 border-2 border-cyan-500/30 border-dashed rounded-2xl cursor-pointer bg-black/40 hover:bg-black/60 transition-all duration-300">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="relative">
                        <Upload className="w-16 h-16 text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                        <Sparkles className="w-6 h-6 text-purple-400 absolute -top-2 -right-2 animate-pulse" />
                      </div>
                      <p className="mb-2 text-lg text-cyan-100 neon-text">
                        <span className="font-semibold">Drop your PDF here</span>
                      </p>
                      <p className="text-sm text-cyan-300/70">or click to browse</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="InputContainerlication/pdf"
                      onChange={onFileChange}
                    />
                  </label>
                </div>
                {file && (
                  <div className="flex items-center justify-between bg-black/60 p-4 rounded-xl border border-cyan-500/20 neon-border">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-cyan-400" />
                      <span className="text-cyan-100 font-medium neon-text">{file.name}</span>
                    </div>
                    <button
                      onClick={handleFile}
                      disabled={loading}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed neon-border"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                      ) : (
                        <span className="flex items-center">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Analyze PDF
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Section */}
            {summary && (
              <div className="bg-black/50 rounded-2xl border border-cyan-500 p-8 transition-all duration-300 hover:border-purple-500 neon-border">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-6 flex items-center neon-text">
                  <Sparkles className="w-6 h-6 mr-2 text-cyan-400" />
                  Key Insights
                </h2>
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {summary}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Chat Interface */}
          <div className="bg-black/50 rounded-2xl border border-cyan-500 p-8 flex flex-col h-[calc(100vh-12rem)] neon-border">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-6 flex items-center neon-text">
              <MessageSquare className="h-6 w-6 mr-2 text-cyan-400" />
              Ask Questions
            </h2>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-4 custom-scrollbar">
              {chat.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white neon-border'
                        : 'bg-black/60 text-cyan-100 border border-cyan-500/20 neon-border'
                    }`}
                  >
                    {message.role === 'bot' && (
                      <Bot className="h-5 w-5 mb-2 text-cyan-400" />
                    )}
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-black/60 rounded-2xl p-4 border border-cyan-500/20 neon-border">
                    <Loader2 className="animate-spin h-5 w-5 text-cyan-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-cyan-500/20 pt-6">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask anything about your PDF..."
                  className="flex-1 rounded-xl bg-black/60 border border-cyan-500/20 px-4 py-3 text-cyan-100 placeholder-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent neon-border"
                  onKeyPress={(e) => e.key === 'Enter' && handleQuestion()}
                />
                <button
                  onClick={handleQuestion}
                  disabled={!question.trim() || loading}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed neon-border"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default InputContainer;