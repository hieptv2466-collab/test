import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Download, File as FileIcon, Folder, Shield, Code, ChevronRight, Github } from "lucide-react";
import { useState } from "react";
import { pluginData } from "./lib/pluginData";

export default function App() {
  const [selectedFile, setSelectedFile] = useState<string>("README.md");

  const handleDownloadZip = async () => {
    const zip = new JSZip();

    Object.entries(pluginData).forEach(([path, content]) => {
      // Create folders if they don't exist
      const folders = path.split("/");
      folders.pop(); // Remove file name
      let currentFolder = zip;
      folders.forEach((folder) => {
        currentFolder = currentFolder.folder(folder)!;
      });

      zip.file(path, content);
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "cloudstream-addon-vietnamese.zip");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">CloudStream <span className="text-blue-400">Vietnamese Addon</span></h1>
            <p className="text-xs text-gray-400">Template Hoàn Thiện & GitHub Actions CI/CD</p>
          </div>
        </div>
        <button
          onClick={handleDownloadZip}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-md transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Tải Mã Nguồn (ZIP)
        </button>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar - File Explorer */}
        <div className="w-72 border-r border-gray-800 bg-gray-900/50 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-800 flex items-center gap-2">
            <Folder className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">Explorer</h2>
          </div>
          <div className="p-2 flex flex-col gap-1">
            {Object.keys(pluginData).sort().map((filePath) => {
              const isSelected = selectedFile === filePath;
              const depth = filePath.split("/").length - 1;
              const fileName = filePath.split("/").pop();
              
              return (
                <button
                  key={filePath}
                  onClick={() => setSelectedFile(filePath)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors text-left ${
                    isSelected ? "bg-blue-600/20 text-blue-400" : "hover:bg-gray-800/60 text-gray-400"
                  }`}
                  style={{ paddingLeft: `${(depth * 1) + 0.75}rem` }}
                >
                  <FileIcon className={`w-4 h-4 shrink-0 ${isSelected ? "text-blue-400" : "text-gray-500"}`} />
                  <span className="truncate">{fileName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
          {/* File Tabs */}
          <div className="flex border-b border-gray-800 bg-[#252526] overflow-x-auto">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] border-t-2 border-t-blue-500 min-w-max">
              <FileIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-sm text-gray-300">{selectedFile.split('/').pop()}</span>
            </div>
            {/* Breadcrumb hint */}
            <div className="flex-1 flex items-center px-4 gap-1 text-xs text-gray-500 border-l border-gray-800">
              <span className="truncate">{selectedFile.replace(/\\//g, " > ")}</span>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4">
            <pre className="text-[13px] leading-relaxed font-mono text-gray-300">
              <code>{pluginData[selectedFile as keyof typeof pluginData]}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Instruction Footer */}
      <footer className="border-t border-gray-800 bg-gray-900 p-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-start gap-4">
          <div className="bg-gray-800 p-3 rounded-full shrink-0">
            <Github className="w-5 h-5 text-gray-300" />
          </div>
          <div className="text-sm text-gray-400 space-y-2">
            <p className="font-semibold text-gray-200">Hướng dẫn sử dụng với GitHub Actions:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Nhấn nút <strong>Tải Mã Nguồn (ZIP)</strong> bên trên và giải nén.</li>
              <li>Tạo một repository mới trên GitHub của bạn và đẩy (push) toàn bộ file lên đó.</li>
              <li>GitHub Actions sẽ tự động biên dịch addon thành đuôi <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">.cs3</code>.</li>
              <li>Vào repository của bạn: chọn <strong>Settings</strong> &gt; <strong>Pages</strong>, chọn nguồn deploy là nhánh <code className="bg-gray-800 px-1 py-0.5 rounded text-blue-400">gh-pages</code> rồi lưu lại.</li>
              <li>Sử dụng link <code className="bg-gray-800 px-1 py-0.5 rounded text-blue-400">https://&lt;username&gt;.github.io/&lt;repo&gt;/plugins.json</code> để chèn vào ứng dụng CloudStream!</li>
            </ol>
          </div>
        </div>
      </footer>
    </div>
  );
}
