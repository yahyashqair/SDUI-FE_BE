/**
 * Master Dashboard - Main Control Panel UI
 * React component for managing MFEs, Functions, Routes, and Deployment
 */

import React, { useState, useEffect } from 'react';

// --- Interfaces ---

interface MFE {
    name: string;
    source: string;
    version: string;
    active: boolean;
    description?: string;
}

interface FissionFunction {
    name: string;
    env: string;
    executorType: string;
    namespace: string;
}

interface FissionRoute {
    name: string;
    method: string;
    url: string;
    function: string;
}

interface DashboardStats {
    mfeCount: number;
    functionCount: number;
    envCount: number;
    routeCount: number;
}

// --- API Helper ---

const API_BASE = '/api/master';

async function fetchAPI(resource: string, action: string, options: RequestInit = {}) {
    const url = `${API_BASE}?resource=${resource}&action=${action}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    return res.json();
}

// --- Components ---

function Card({ title, children, className = '' }: {
    title: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
            {children}
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
    return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-indigo-100 text-sm">{label}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                </div>
                <span className="text-4xl opacity-80">{icon}</span>
            </div>
        </div>
    );
}

// --- MFE List Component with Preview ---

function MFEList({ mfes, onRefresh }: { mfes: MFE[]; onRefresh: () => void }) {
    const [previewMfe, setPreviewMfe] = useState<MFE | null>(null);

    const handleToggle = async (name: string, active: boolean) => {
        await fetchAPI('mfe', 'toggle', {
            method: 'POST',
            body: JSON.stringify({ name, active: !active })
        });
        onRefresh();
    };

    const handleBump = async (name: string) => {
        await fetchAPI('mfe', 'bump', {
            method: 'POST',
            body: JSON.stringify({ name, type: 'patch' })
        });
        onRefresh();
    };

    return (
        <div className="space-y-3">
            {mfes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No MFEs registered</p>
            ) : (
                mfes.map(mfe => (
                    <div
                        key={mfe.name}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${mfe.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                <span className="font-medium text-gray-900 dark:text-white">{mfe.name}</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                    v{mfe.version}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 truncate max-w-md">{mfe.source}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPreviewMfe(mfe)}
                                className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                                Preview
                            </button>
                            <button
                                onClick={() => handleBump(mfe.name)}
                                className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                                Bump
                            </button>
                            <button
                                onClick={() => handleToggle(mfe.name, mfe.active)}
                                className={`px-3 py-1.5 text-xs rounded ${mfe.active
                                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                            >
                                {mfe.active ? 'Disable' : 'Enable'}
                            </button>
                        </div>
                    </div>
                ))
            )}

            {/* Preview Modal */}
            {previewMfe && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                            <h3 className="font-bold text-lg dark:text-white">Preview: {previewMfe.name}</h3>
                            <button onClick={() => setPreviewMfe(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300">✕</button>
                        </div>
                        <div className="flex-1 p-4 bg-gray-100 dark:bg-gray-900 overflow-auto">
                            <div className="bg-white p-4 rounded shadow">
                                <p className="mb-2 font-semibold">Source URL:</p>
                                <code className="block bg-gray-100 p-2 rounded text-sm break-all mb-4">
                                    {previewMfe.source}
                                </code>
                                <p className="text-sm text-gray-500">
                                    To preview properly, this MFE needs to be loaded by the specific host application.
                                    <br />
                                    Showing raw content info merely confirms existence.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Function Editor Component ---

function FunctionEditor({ onDeploy }: { onDeploy: () => void }) {
    const [name, setName] = useState('');
    const [code, setCode] = useState(`module.exports = async function(context) {
    return {
        status: 200,
        body: { message: "Hello from Fission!" }
    };
};`);
    const [status, setStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleDeploy = async () => {
        if (!name || !code) return;
        setStatus('deploying');
        try {
            // First check if exists to determine update vs create
            // For simplicity in this demo, we'll try create, if fail then update
            let res = await fetchAPI('function', 'create', {
                method: 'POST',
                body: JSON.stringify({ name, env: 'nodejs', code, namespace: 'default' })
            });

            if (res.status !== 201) {
                // Try update
                res = await fetchAPI('function', 'update', {
                    method: 'POST',
                    body: JSON.stringify({ name, codePath: '', code, namespace: 'default' })
                });
            }

            if (res.success || res.status === 200 || res.status === 201) {
                setStatus('success');
                setMessage('Function deployed successfully!');
                onDeploy();
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                throw new Error(res.error || res.message || 'Deployment failed');
            }
        } catch (e: any) {
            setStatus('error');
            setMessage(e.message);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Function Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="my-function"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Runtime Environment</label>
                    <select disabled className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                        <option>Node.js</option>
                    </select>
                </div>
                <button
                    onClick={handleDeploy}
                    disabled={status === 'deploying' || !name}
                    className={`w-full py-2 px-4 rounded-lg text-white font-medium ${status === 'deploying' ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                >
                    {status === 'deploying' ? 'Deploying...' : 'Deploy Function'}
                </button>
                {status === 'success' && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{message}</p>}
                {status === 'error' && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{message}</p>}
            </div>
            <div className="h-96">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Function Code</label>
                <textarea
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full h-full p-4 font-mono text-sm bg-gray-900 text-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    spellCheck={false}
                />
            </div>
        </div>
    );
}

// --- Route Manager Component ---

function RouteManager({ routes, onRefresh }: { routes: FissionRoute[]; onRefresh: () => void }) {
    const [newRoute, setNewRoute] = useState({ name: '', method: 'GET', url: '', function: '' });
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!newRoute.name || !newRoute.url || !newRoute.function) return;
        setCreating(true);
        try {
            await fetchAPI('route', 'create', {
                method: 'POST',
                body: JSON.stringify(newRoute)
            });
            onRefresh();
            setNewRoute({ name: '', method: 'GET', url: '', function: '' });
        } catch (e) {
            alert('Failed to create route');
        }
        setCreating(false);
    };

    const handleDelete = async (name: string) => {
        if (!confirm(`Delete route ${name}?`)) return;
        try {
            await fetchAPI('route', 'delete', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            onRefresh();
        } catch (e) {
            alert('Failed to delete route');
        }
    };

    return (
        <div className="space-y-6">
            {/* Create Route Form */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium mb-1 dark:text-gray-300">Name</label>
                    <input
                        type="text"
                        value={newRoute.name}
                        onChange={e => setNewRoute({ ...newRoute, name: e.target.value })}
                        className="w-full px-3 py-1.5 rounded border dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        placeholder="my-route"
                    />
                </div>
                <div className="w-24">
                    <label className="block text-xs font-medium mb-1 dark:text-gray-300">Method</label>
                    <select
                        value={newRoute.method}
                        onChange={e => setNewRoute({ ...newRoute, method: e.target.value })}
                        className="w-full px-3 py-1.5 rounded border dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    >
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>DELETE</option>
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium mb-1 dark:text-gray-300">URL Pattern</label>
                    <input
                        type="text"
                        value={newRoute.url}
                        onChange={e => setNewRoute({ ...newRoute, url: e.target.value })}
                        className="w-full px-3 py-1.5 rounded border dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        placeholder="/api/data"
                    />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium mb-1 dark:text-gray-300">Target Function</label>
                    <input
                        type="text"
                        value={newRoute.function}
                        onChange={e => setNewRoute({ ...newRoute, function: e.target.value })}
                        className="w-full px-3 py-1.5 rounded border dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        placeholder="function-name"
                    />
                </div>
                <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                    {creating ? 'Adding...' : 'Add Route'}
                </button>
            </div>

            {/* Routes List */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm dark:text-gray-300">
                    <thead className="bg-gray-100 dark:bg-gray-700 uppercase font-medium text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Method</th>
                            <th className="px-4 py-3">URL</th>
                            <th className="px-4 py-3">Function</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {routes.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-500">No routes defined</td></tr>
                        ) : (
                            routes.map(r => (
                                <tr key={r.name} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-4 py-3 font-medium">{r.name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                                                r.method === 'POST' ? 'bg-green-100 text-green-700' :
                                                    r.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                            }`}>
                                            {r.method}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{r.url}</td>
                                    <td className="px-4 py-3">{r.function}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(r.name)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- Main Dashboard Component ---

export default function MasterDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'mfes' | 'functions' | 'routes' | 'editor'>('overview');
    const [stats, setStats] = useState<DashboardStats>({ mfeCount: 0, functionCount: 0, envCount: 0, routeCount: 0 });
    const [mfes, setMfes] = useState<MFE[]>([]);
    const [functions, setFunctions] = useState<FissionFunction[]>([]);
    const [routes, setRoutes] = useState<FissionRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [mfeRes, fnRes, routeRes] = await Promise.all([
                fetch('/mfe/mfe-registry.json').then(r => r.json()).catch(() => ({ mfes: {} })),
                fetchAPI('function', 'list').catch(() => ({ data: [] })),
                fetchAPI('route', 'list').catch(() => ({ data: [] }))
            ]);

            const mfeList = Object.entries(mfeRes.mfes || {}).map(([name, config]: [string, any]) => ({
                name,
                ...config,
                active: config.active !== false
            }));

            setMfes(mfeList);
            setFunctions(fnRes.data || []);
            setRoutes(routeRes.data || []);
            setStats({
                mfeCount: mfeList.length,
                functionCount: fnRes.data?.length || 0,
                envCount: 1,
                routeCount: routeRes.data?.length || 0
            });
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading && mfes.length === 0) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-pulse text-xl text-gray-600">Loading Master Control Panel...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Master Control Panel
                        </h1>
                        <p className="text-gray-500 mt-1">Manage MFEs, Functions, and Releases</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={loadData}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                        >
                            <span>↻</span> Refresh
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'mfes', label: 'Micro-Frontends' },
                        { id: 'functions', label: 'Functions' },
                        { id: 'routes', label: 'Routes' },
                        { id: 'editor', label: 'Deploy Code' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <StatCard label="Micro-Frontends" value={stats.mfeCount} icon="📦" />
                            <StatCard label="Functions" value={stats.functionCount} icon="⚡" />
                            <StatCard label="Environments" value={stats.envCount} icon="🌍" />
                            <StatCard label="Routes" value={stats.routeCount} icon="🔀" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card title="Recently Updated MFEs">
                                <MFEList mfes={mfes.slice(0, 5)} onRefresh={loadData} />
                            </Card>
                            <Card title="Active Functions">
                                <ul className="space-y-2">
                                    {functions.slice(0, 5).map(fn => (
                                        <li key={fn.name} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                            <span className="font-medium">{fn.name}</span>
                                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">{fn.env}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </div>
                    </>
                )}

                {/* MFEs Tab */}
                {activeTab === 'mfes' && (
                    <Card title="Micro-Frontend Management" className="max-w-5xl">
                        <MFEList mfes={mfes} onRefresh={loadData} />
                    </Card>
                )}

                {/* Functions Tab */}
                {activeTab === 'functions' && (
                    <Card title="Function List" className="max-w-5xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Env</th>
                                        <th className="px-4 py-3">Executor</th>
                                        <th className="px-4 py-3">Namespace</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {functions.map(fn => (
                                        <tr key={fn.name} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 font-medium">{fn.name}</td>
                                            <td className="px-4 py-3">{fn.env}</td>
                                            <td className="px-4 py-3">{fn.executorType}</td>
                                            <td className="px-4 py-3">{fn.namespace}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Routes Tab */}
                {activeTab === 'routes' && (
                    <Card title="Route Management" className="max-w-5xl">
                        <RouteManager routes={routes} onRefresh={loadData} />
                    </Card>
                )}

                {/* Editor Tab */}
                {activeTab === 'editor' && (
                    <Card title="Deploy Serverless Function" className="max-w-6xl">
                        <FunctionEditor onDeploy={loadData} />
                    </Card>
                )}
            </div>
        </div>
    );
}
