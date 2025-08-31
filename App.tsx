import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { LanguageSelector } from './components/LanguageSelector';
import { TranslationDisplay } from './components/TranslationDisplay';
import { Loader } from './components/Loader';
import { TARGET_LANGUAGES } from './constants';
import type { TranslationResult } from './types';
import { translateImageContent } from './services/geminiService';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { TranslationDetails } from './components/TranslationDetails';


// Helper function to get an array of lines for text wrapping
const getWrappedLines = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] => {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine === '' ? word : currentLine + ' ' + word;
    const { width } = ctx.measureText(testLine);

    if (width < maxWidth || currentLine === '') {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
};

// Helper function to draw text, fitting it to the box by adjusting font size
const drawTextAndFit = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  let fontSize = Math.floor(height / 2); // Start with a reasonable font size

  while (fontSize >= 8) { // Minimum font size
    ctx.font = `${fontSize}px sans-serif`;
    const lineHeight = fontSize * 1.2;
    const lines = getWrappedLines(ctx, text, width - 4); // small padding
    const textHeight = lines.length * lineHeight;

    if (textHeight <= height) {
      // It fits, so we draw it
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'white';
      
      const startY = y + (height - textHeight) / 2; // Center vertically

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineWidth = ctx.measureText(line).width;
        const startX = x + (width - lineWidth) / 2; // Center horizontally
        ctx.fillText(line, startX, y + (i * lineHeight));
      }
      return; // Done
    }

    fontSize -= 1; // Doesn't fit, shrink font and retry
  }
  
  // As a fallback if it's impossible to fit, draw at smallest size and let it clip.
  if (fontSize < 8) {
      const finalFontSize = 8;
      ctx.font = `${finalFontSize}px sans-serif`;
      const lineHeight = finalFontSize * 1.2;
      const lines = getWrappedLines(ctx, text, width - 4);
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'white';
      ctx.save();
      ctx.beginPath();
      ctx.rect(x,y,width,height);
      ctx.clip();
      for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineWidth = ctx.measureText(line).width;
          const startX = x + (width - lineWidth) / 2;
          ctx.fillText(line, startX, y + (i * lineHeight));
      }
      ctx.restore();
  }
};


export default function App(): React.ReactNode {
  const [file, setFile] = useState<File | null>(null);
  const [fileDataURL, setFileDataURL] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>(TARGET_LANGUAGES[0].value);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setTranslationResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileDataURL(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleTranslate = useCallback(async () => {
    if (!file || !fileDataURL) {
      setError('Please select a file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTranslationResult(null);

    try {
      const base64String = fileDataURL.split(',')[1];
      const mimeType = file.type;
      
      const result = await translateImageContent(base64String, mimeType, targetLanguage);
      setTranslationResult(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during translation.');
    } finally {
      setIsLoading(false);
    }
  }, [file, fileDataURL, targetLanguage]);

  const handleDownload = useCallback(() => {
    if (!fileDataURL || !translationResult || !file) return;

    setIsDownloading(true);

    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setError('Could not create image context for download.');
        setIsDownloading(false);
        return;
      }
      
      ctx.drawImage(image, 0, 0);

      translationResult.translationBlocks.forEach(block => {
        const { boundingBox, translatedText } = block;
        const x = (boundingBox.x / 100) * canvas.width;
        const y = (boundingBox.y / 100) * canvas.height;
        const width = (boundingBox.width / 100) * canvas.width;
        const height = (boundingBox.height / 100) * canvas.height;
        
        if (width < 1 || height < 1) return;

        ctx.fillStyle = '#111827'; // bg-gray-900
        ctx.fillRect(x, y, width, height);

        drawTextAndFit(ctx, translatedText, x, y, width, height);
      });
      
      const link = document.createElement('a');
      const fileName = file.name.substring(0, file.name.lastIndexOf('.'));
      link.download = `${fileName}-translated.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsDownloading(false);
    };
    
    image.onerror = () => {
        setError("Could not load the image to generate the download.");
        setIsDownloading(false);
    }

    image.src = fileDataURL;

  }, [fileDataURL, translationResult, file]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-transparent bg-clip-text">
            Tomeus
          </h1>
          <p className="mt-3 text-lg text-gray-400 max-w-2xl mx-auto">
            Upload an image or PDF. AI will detect, translate, and overlay text in its original position.
          </p>
        </header>

        <main className="w-full">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 lg:p-8 border border-gray-700">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-1 space-y-6">
                <FileUpload onFileSelect={handleFileSelect} />
                
                <LanguageSelector
                  selectedLanguage={targetLanguage}
                  onLanguageChange={setTargetLanguage}
                />
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleTranslate}
                      disabled={!file || isLoading || isDownloading}
                      className="w-full flex-grow flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
                    >
                      {isLoading ? 'Translating...' : 'Translate'}
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={!translationResult || isLoading || isDownloading}
                        className="w-full sm:w-auto flex items-center justify-center bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50"
                        aria-label="Download translated image"
                    >
                        <DownloadIcon className="h-5 w-5 sm:mr-2"/>
                        <span className="sm:hidden">{isDownloading ? '...' : 'DL'}</span>
                        <span className="hidden sm:inline">{isDownloading ? 'Processing...' : 'Download'}</span>
                    </button>
                </div>
              </div>

              <div className="lg:col-span-2 w-full min-h-[400px] bg-gray-900/70 rounded-xl border border-gray-700 flex items-center justify-center p-4">
                {isLoading && <Loader />}
                {error && <div className="text-red-400 text-center">{error}</div>}
                {!isLoading && !error && (
                   <TranslationDisplay 
                     originalImage={fileDataURL}
                     translatedData={translationResult?.translationBlocks ?? null}
                   />
                )}
              </div>
            </div>
          </div>
          
          {!isLoading && translationResult?.formattedTranslation && (
            <TranslationDetails formattedTranslation={translationResult.formattedTranslation} />
          )}

        </main>
      </div>
    </div>
  );
}