import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [theme, setTheme] = useState('light'); 
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [query, setQuery] = useState('');
  const [querying, setQuerying] = useState(false);
  const [error, setError] = useState('');

 
  const [conversations, setConversations] = useState([]);

  const [activeViz, setActiveViz] = useState(null);

  const API_BASE = 'http://10.87.60.56:8004';

  useEffect(() => {
    document.title = 'ASTRA AI';
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const formatSummary = (text) => {
    if (!text) return '';
    return text
      .split('\n')
      .map((line) => {
        if (line.startsWith('### ')) {
          return `<h3 class="summary-h3">${line.replace('### ', '')}</h3>`;
        } else if (line.startsWith('## ')) {
          return `<h2 class="summary-h2">${line.replace('## ', '')}</h2>`;
        } else if (line.startsWith('# ')) {
          return `<h1 class="summary-h1">${line.replace('# ', '')}</h1>`;
        }
        if (line.includes('**')) {
          line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
        if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
          return `<li class="summary-li">${line.replace(/^[\s-•]+/, '')}</li>`;
        }
        if (line.trim() === '') {
          return '<br />';
        }
        return `<p class="summary-p">${line}</p>`;
      })
      .join('');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setUploadSuccess(false);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setFileId(data.file_id);
        setUploadSuccess(true);
        setError('');
      } else {
        setError('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Upload error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleQuery = async () => {
    if (!fileId) {
      setError('Please upload and index a dataset first');
      return;
    }
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    const currentQuery = query.trim(); 

    setQuerying(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: fileId,
          query: currentQuery,
        }),
      });
      const data = await response.json();
      if (data.success || data.summary) {
        setConversations((prev) => [...prev, { query: currentQuery, result: data }]);
        setError('');
        setQuery('');
      } else {
        setError('Query failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Query error: ' + err.message);
    } finally {
      setQuerying(false);
    }
  };

  const handleClear = () => {
    setConversations([]);
    setQuery('');
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!querying) {
        handleQuery();
      }
    }
  };

  const exampleQueries = [
    'What is the total sales?',
    'Show me the top 5 products by revenue with a chart',
    'Find problematic orders',
    'Average profit by region with visualization',
    'Summarize the entire dataset',
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={`app-root theme-${theme}`}>
      <div className="app-shell">
        {}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">A</div>
          </div>
          <nav className="sidebar-nav">
            <button className="sidebar-icon sidebar-icon--active" type="button">
              <span className="icon">⌾</span>
              <span className="tooltip">New chat</span>
            </button>
            <button className="sidebar-icon" type="button">
              <span className="icon">★</span>
              <span className="tooltip">Starred</span>
            </button>
            <button className="sidebar-icon" type="button">
              <span className="icon">📊</span>
              <span className="tooltip">Datasets</span>
            </button>
          </nav>
          <div className="sidebar-footer">
            <button className="sidebar-icon" type="button" onClick={handleClear}>
              <span className="icon">🧹</span>
              <span className="tooltip">Clear chat</span>
            </button>
            <button className="sidebar-icon" type="button">
              <span className="icon">?</span>
              <span className="tooltip">Help</span>
            </button>
          </div>
        </aside>

        {}
        <div className="main">
          <header className="main-header">
            <div className="main-header-left">
              <div className="brand">
                <div className="brand-title">ASTRA AI</div>
                <div className="brand-subtitle">
                  LLM analytics copilot for your datasets
                </div>
              </div>
            </div>
            <div className="main-header-right">
              <div className="dataset-status">
                <span
                  className={`dataset-dot ${fileId ? 'dataset-dot--online' : ''}`}
                />
                <span className="dataset-status-text">
                  {fileId ? 'Dataset connected' : 'No dataset connected'}
                </span>
                {fileName && (
                  <span className="dataset-file-name" title={fileName}>
                    • {fileName}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="btn btn-ghost theme-toggle"
                onClick={toggleTheme}
              >
                <span className="theme-toggle-icon">
                  {theme === 'dark' ? '☀️' : '🌙'}
                </span>
                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
              <div className="avatar-pill">
                <span className="avatar-initials">JJ</span>
              </div>
            </div>
          </header>

          {error && (
            <div className="error-banner">
              <span className="error-icon">!</span>
              <div className="error-text">
                <strong>Error</strong>
                <span>{error}</span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setError('')}
              >
                Dismiss
              </button>
            </div>
          )}

          <main className="chat-layout">
            <section className="chat-section">
              <div className="chat-window">
                {}
                {conversations.length === 0 && !querying && (
                  <div className="welcome">
                    <div className="welcome-orb">
                      <div className="welcome-orb-glow" />
                      <div className="welcome-orb-core" />
                      <div className="welcome-orb-ring" />
                    </div>
                    <h1 className="welcome-title">
                      {getGreeting()}, Jithin J
                    </h1>
                    <p className="welcome-subtitle">What&apos;s on your mind today?</p>
                    <p className="welcome-subsubtitle">
                      Attach a dataset and let ASTRA uncover patterns, anomalies, and
                      insights for you.
                    </p>
                    <div className="welcome-suggestions">
                      {exampleQueries.slice(0, 3).map((q) => (
                        <button
                          key={q}
                          type="button"
                          className="welcome-card"
                          onClick={() => setQuery(q)}
                        >
                          <div className="welcome-card-title">{q}</div>
                          <div className="welcome-card-sub">
                            Ask ASTRA to explore this from your dataset.
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {}
                {conversations.map((item, idx) => {
                  const res = item.result || {};
                  const ic = res.intent_classification;
                  const vs = res.vector_search;
                  const vizList = res.results?.visualizations;
                  const textOutput = res.results?.text_output;

                  return (
                    <React.Fragment key={idx}>
                      {}
                      <div className="chat-row chat-row--user">
                        <div className="chat-message chat-message--user">
                          <div className="chat-bubble chat-bubble--user">
                            <div className="chat-bubble-header">
                              <span className="chat-author">You</span>
                            </div>
                            <p className="chat-text">{item.query}</p>
                          </div>
                        </div>
                      </div>

                      {}
                      <div className="chat-row chat-row--assistant">
                        <div className="chat-message chat-message--assistant">
                          <div className="chat-bubble chat-bubble--assistant">
                            <div className="chat-bubble-header">
                              <span className="chat-author">ASTRA</span>
                              <span className="chat-meta-small">
                                {res.processing_time
                                  ? `${res.processing_time.toFixed(2)}s`
                                  : ''}
                              </span>
                            </div>

                            {ic && (
                              <details className="meta-block meta-details">
                                <summary className="meta-details-summary">
                                  <span>Query analysis</span>
                                  <span className="meta-details-arrow">▾</span>
                                </summary>
                                <div className="meta-details-inner">
                                  <div className="meta-grid">
                                    <div className="meta-item">
                                      <span className="meta-label">Approach</span>
                                      <span className="pill pill-solid">
                                        {ic.primary_approach}
                                      </span>
                                    </div>
                                    <div className="meta-item">
                                      <span className="meta-label">Type</span>
                                      <span className="meta-value">
                                        {ic.query_type}
                                      </span>
                                    </div>
                                    <div className="meta-item">
                                      <span className="meta-label">
                                        Needs visualization
                                      </span>
                                      <span className="meta-value">
                                        {ic.needs_visualization ? '✅ Yes' : '❌ No'}
                                      </span>
                                    </div>
                                    <div className="meta-item">
                                      <span className="meta-label">
                                        Vector search
                                      </span>
                                      <span className="meta-value">
                                        {ic.needs_vector_search
                                          ? '✅ Used'
                                          : '❌ Not used'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </details>
                            )}

                            {vs && vs.chunks_retrieved > 0 && (
                              <div className="meta-block meta-block--accent">
                                <h3 className="meta-title">🔍 Semantic search</h3>
                                <p className="meta-text">
                                  Retrieved{' '}
                                  <strong>{vs.chunks_retrieved}</strong> relevant
                                  chunks from the vector index.
                                </p>
                                <p className="meta-sub">
                                  Top relevance score:{' '}
                                  {vs.top_score != null
                                    ? vs.top_score.toFixed(3)
                                    : '—'}
                                </p>
                              </div>
                            )}

                            {res.visualization && (
                              <div className="viz-block">
                                <h3 className="meta-title">Primary visualization</h3>
                                <div className="viz-frame">
                                  <img
                                    src={`data:image/png;base64,${res.visualization}`}
                                    alt="Data Visualization"
                                    className="viz-image viz-image--clickable"
                                    onClick={() =>
                                      setActiveViz(
                                        `data:image/png;base64,${res.visualization}`
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            )}

                            {vizList && vizList.length > 1 && (
                              <div className="viz-block">
                                <h3 className="meta-title">
                                  Additional visualizations ({vizList.length})
                                </h3>
                                <div className="viz-grid">
                                  {vizList.map((viz, vIdx) => (
                                    <div key={vIdx} className="viz-item">
                                      <p className="viz-label">Chart {vIdx + 1}</p>
                                      <img
                                        src={`data:image/png;base64,${viz}`}
                                        alt={`Visualization ${vIdx + 1}`}
                                        className="viz-image viz-image--clickable"
                                        onClick={() =>
                                          setActiveViz(
                                            `data:image/png;base64,${viz}`
                                          )
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {res.summary && (
                              <div className="summary-block">
                                <h3 className="meta-title">Summary</h3>
                                <div
                                  className="summary-content"
                                  dangerouslySetInnerHTML={{
                                    __html: formatSummary(res.summary),
                                  }}
                                />
                              </div>
                            )}

                            {textOutput && (
                              <details className="raw-output">
                                <summary>View raw output</summary>
                                <pre>{textOutput}</pre>
                              </details>
                            )}

                            <div className="meta-footer">
                              <span className="meta-footer-status">
                                ✅ Analysis complete
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

                {querying && (
                  <div className="chat-row chat-row--assistant typing-row">
                    <div className="chat-message chat-message--assistant">
                      <div className="chat-bubble chat-bubble--assistant typing-bubble">
                        <div className="chat-bubble-header">
                          <span className="chat-author">ASTRA</span>
                        </div>
                        <div className="typing">
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </main>

          {}
          <footer className="input-area">
            {!fileId && (
              <div className="input-hint">
                Attach a CSV / XLS / XLSX file to index your dataset before asking
                questions.
              </div>
            )}

            <div className="input-row">
              <div className="input-inner">
                <button
                  type="button"
                  className="icon-button attach-button"
                  title="Attach dataset"
                >
                  <span className="attach-icon">📎</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                </button>
                <textarea
                  className="chat-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    fileId
                      ? 'Ask anything about your dataset…'
                      : 'Attach a dataset and then ask a question…'
                  }
                  disabled={querying}
                  rows={1}
                />
                <button
                  type="button"
                  className="icon-button send-button"
                  onClick={handleQuery}
                  disabled={!query.trim() || querying}
                  title="Send message"
                >
                  {querying ? (
                    <span className="btn-loader" />
                  ) : (
                    <span className="send-icon">➤</span>
                  )}
                </button>
              </div>
            </div>

            <div className="input-meta-row">
              <div className="upload-inline">
                {file && !uploadSuccess && (
                  <>
                    <span className="upload-inline-text">
                      {fileName || 'Selected file'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={handleUpload}
                      disabled={uploading}
                    >
                      {uploading && <span className="btn-loader" />}
                      {uploading ? 'Uploading…' : 'Upload & index'}
                    </button>
                  </>
                )}
                {uploadSuccess && (
                  <span className="upload-success-inline">
                    ✅ Dataset indexed and ready
                  </span>
                )}
              </div>

              <div className="chips-row">
                {exampleQueries.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="chip"
                    onClick={() => setQuery(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="fine-print">
              ASTRA may generate inaccurate results. Always verify important
              insights against your data.
            </div>
          </footer>
        </div>

        {}
        {activeViz && (
          <div className="viz-modal" onClick={() => setActiveViz(null)}>
            <div
              className="viz-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="viz-modal-close"
                onClick={() => setActiveViz(null)}
              >
                ✕
              </button>
              <img src={activeViz} alt="Expanded visualization" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
