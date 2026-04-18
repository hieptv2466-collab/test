import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Download, File as FileIcon, Folder, Shield, Code, ChevronRight, Github, Upload, X, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { pluginData } from "./lib/pluginData";

export default function App() {
  const [selectedFile, setSelectedFile] = useState<string>("README.md");
  const [showGithubPopup, setShowGithubPopup] = useState(false);
  const [repoName, setRepoName] = useState("forcef5/test1");
  const [githubToken, setGithubToken] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handlePushToGithub = async () => {
    if (!repoName || !githubToken) {
      alert("Vui lòng nhập tên repository và Personal Access Token!");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Đang chuẩn bị đẩy file...");
    setUploadProgress(0);

    const files = Object.entries(pluginData);
    let successCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const [filePath, content] = files[i];
        setUploadStatus(`Đang đẩy: ${filePath} (${i + 1}/${files.length})`);
        
        // Convert to UTF-8 base64 safely
        const utf8Bytes = new TextEncoder().encode(content);
        const binString = Array.from(utf8Bytes).map(byte => String.fromCodePoint(byte)).join('');
        const b64Content = btoa(binString);

        // Check if file exists to get SHA (required to update existing file)
        const getUrl = `https://api.github.com/repos/${repoName}/contents/${filePath}`;
        const getRes = await fetch(getUrl, {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: "application/vnd.github.v3+json"
          }
        });
        
        let sha;
        if (getRes.ok) {
          const data = await getRes.json();
          sha = data.sha;
        }

        // Upload or update
        const putRes = await fetch(getUrl, {
          method: "PUT",
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: `Auto Create/Update ${filePath}`,
            content: b64Content,
            sha: sha
          })
        });

        if (!putRes.ok) {
          const errData = await putRes.json();
          throw new Error(errData.message || `HTTP ${putRes.status}`);
        }
        
        successCount++;
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      setUploadStatus(`Thành công! Đã đẩy ${successCount}/${files.length} file lên Github.`);
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadStatus(`Có lỗi xảy ra: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col font-sans relative">
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGithubPopup(true)}
            className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-5 rounded-md transition-colors flex items-center gap-2 border border-gray-700"
          >
            <Github className="w-4 h-4" />
            Đẩy lên GitHub ngay
          </button>
          <button
            onClick={handleDownloadZip}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-md transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Tải Mã Nguồn (ZIP)
          </button>
        </div>
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
              <li>Sử dụng chức năng <strong>Đẩy lên GitHub ngay</strong> hoặc tải file ZIP về upload thủ công.</li>
              <li>GitHub Actions sẽ tự động biên dịch addon thành đuôi <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">.cs3</code>.</li>
              <li>Vào repository của bạn: chọn <strong>Settings</strong> &gt; <strong>Pages</strong>, chọn nguồn deploy là nhánh <code className="bg-gray-800 px-1 py-0.5 rounded text-blue-400">gh-pages</code> rồi lưu lại.</li>
              <li>Sử dụng link <code className="bg-gray-800 px-1 py-0.5 rounded text-blue-400">https://&lt;username&gt;.github.io/&lt;repo&gt;/plugins.json</code> để chèn vào ứng dụng CloudStream!</li>
            </ol>
          </div>
        </div>
      </footer>

      {/* GitHub Push Modal */}
      {showGithubPopup && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl flex flex-col relative text-gray-200">
            <button 
              onClick={() => !isUploading && setShowGithubPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white disabled:opacity-50"
              disabled={isUploading}
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold mb-1">Đẩy thẳng lên GitHub</h3>
            <p className="text-sm text-gray-400 mb-6">Bạn sẽ dùng Personal Access Token để tạo các tệp trực tiếp lên <strong>{repoName || "Repository của bạn"}</strong>.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Tên Repository (Owner/Repo)</label>
                <input 
                  type="text" 
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="ví dụ: forcef5/test1"
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  disabled={isUploading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Personal Access Token (PAT) <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-xs ml-1">(Lấy Token tại đây)</a></label>
                <input 
                  type="password" 
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="Bắt đầu bằng ghp_... hoặc github_pat_..."
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1.5">Note: Token chỉ dùng để gọi API trên máy bạn, không được lưu trên server.</p>
              </div>
            </div>

            {isUploading || uploadStatus ? (
              <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  ) : uploadProgress === 100 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <X className="w-5 h-5 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${isUploading ? 'text-blue-300' : uploadProgress === 100 ? 'text-green-300' : 'text-red-300'}`}>
                    {uploadStatus}
                  </span>
                </div>
                {isUploading && (
                  <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden mt-3">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end gap-3 mt-auto">
              <button 
                onClick={() => setShowGithubPopup(false)}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                disabled={isUploading}
              >
                Hủy
              </button>
              <button 
                onClick={handlePushToGithub}
                disabled={isUploading || !repoName || !githubToken}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors flex items-center gap-2"
              >
                {isUploading ? "Đang đẩy file..." : "Đẩy File Lên Repo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
