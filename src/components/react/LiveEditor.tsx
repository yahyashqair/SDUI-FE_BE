import { useState, useEffect, useRef } from 'react';
import { DynamicSDUIRenderer } from '../../sdui/DynamicRenderer';
import { SNIPPETS } from './snippets';

interface LiveEditorProps {
    initialEndpoint: string;
}

export function LiveEditor({ initialEndpoint }: LiveEditorProps) {
    const [json, setJson] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'both'>('both');
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // Extract slug
    const slug = initialEndpoint.split('/').pop() || 'dashboard';

    useEffect(() => {
        fetch(initialEndpoint)
            .then(res => res.json())
            .then(data => {
                setJson(JSON.stringify(data, null, 2));
            })
            .catch(err => setError(err.message));
    }, [initialEndpoint]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const parsed = JSON.parse(json); // Validate JSON
            const res = await fetch(initialEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: json
            });
            if (!res.ok) throw new Error('Failed to save');
            setRefreshTrigger(prev => prev + 1);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const insertSnippet = (snippetKey: keyof typeof SNIPPETS) => {
        const snippet = SNIPPETS[snippetKey];
        if (textAreaRef.current) {
            const start = textAreaRef.current.selectionStart;
            const end = textAreaRef.current.selectionEnd;
            const text = json;
            const before = text.substring(0, start);
            const after = text.substring(end, text.length);
            const newText = before + snippet + after;
            setJson(newText);
            // Re-focus logic could go here
        } else {
            setJson(prev => prev + '\n' + snippet);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">

            {/* Top Bar */}
            <header className="flex-none h-14 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 shadow-lg z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-inner">
                        SD
                    </div>
                    <div>
                        <h1 className="font-semibold text-lg leading-tight text-gray-100">Live Builder</h1>
                        <div className="text-xs text-gray-400 font-mono">Editing: {slug}</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Toggles */}
                    <div className="hidden md:flex bg-gray-800 rounded-lg p-0.5">
                        <button
                            onClick={() => setActiveTab('editor')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'editor' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                        >Code</button>
                        <button
                            onClick={() => setActiveTab('both')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'both' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                        >Split</button>
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'preview' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                        >Preview</button>
                    </div>

                    <div className="h-6 w-px bg-gray-800 mx-2"></div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`
                    flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all transform active:scale-95
                    ${saving
                                ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 cursor-wait'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/20'}
                `}
                    >
                        {saving ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Deploying...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                                Save & Preview
                            </>
                        )}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">

                {/* Sidebar - Component/Snippet Palette */}
                <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-20 hidden lg:flex">
                    <div className="p-4 border-b border-gray-800">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Component Library</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {Object.keys(SNIPPETS).map((key) => (
                            <button
                                key={key}
                                onClick={() => insertSnippet(key as keyof typeof SNIPPETS)}
                                className="w-full text-left px-3 py-2.5 rounded-md bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 transition-all group group-hover:shadow-md"
                            >
                                <div className="text-sm font-medium text-gray-200 group-hover:text-white">{key}</div>
                                <div className="text-xs text-gray-500 mt-0.5 truncat">Insert {key} snippet</div>
                            </button>
                        ))}
                    </div>
                    <div className="p-4 bg-gray-800/30 border-t border-gray-800 text-xs text-gray-500">
                        Tip: Place cursor in editor and click a component to insert.
                    </div>
                </aside>

                {/* Editor Area */}
                <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${activeTab === 'preview' ? 'hidden' : 'block'}`}>
                    <div className="flex-1 relative">
                        <textarea
                            ref={textAreaRef}
                            value={json}
                            onChange={(e) => setJson(e.target.value)}
                            className="absolute inset-0 w-full h-full p-6 bg-[#0f1117] text-gray-300 font-mono text-sm resize-none focus:outline-none leading-relaxed selection:bg-indigo-500/30"
                            spellCheck={false}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                        />
                    </div>
                    {error && (
                        <div className="bg-red-900/10 border-t border-red-500/20 p-4 animate-slideUp">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                <div>
                                    <h4 className="text-sm font-medium text-red-400">JSON Validation Error</h4>
                                    <p className="text-xs text-red-300/80 mt-1 font-mono">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview Area */}
                <div className={`
             bg-white flex flex-col border-l border-gray-800 transition-all duration-300 shadow-2xl z-30
             ${activeTab === 'both' ? 'w-1/2' : activeTab === 'preview' ? 'w-full' : 'hidden'}
        `}>
                    <div className="flex-none h-10 bg-white border-b border-gray-200 flex items-center justify-between px-4">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Live Preview
                        </span>
                        <div className="text-xs text-gray-400">
                            View: Desktop
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-gray-50/50 relative scrollbar-thin scrollbar-thumb-gray-200">
                        <div className="absolute inset-0 p-8 min-h-max pb-20">
                            <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl min-h-[calc(100vh-12rem)] overflow-hidden transform transition-all duration-300 ease-out origin-top hover:ring-gray-300">
                                <DynamicSDUIRenderer
                                    key={refreshTrigger}
                                    endpoint={initialEndpoint}
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
