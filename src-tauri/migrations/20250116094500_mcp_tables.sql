CREATE TABLE IF NOT EXISTS mcp_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'official',
    endpoint TEXT,
    priority INTEGER NOT NULL DEFAULT 100,
    last_synced_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mcp_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    summary TEXT,
    author TEXT,
    homepage TEXT,
    tags TEXT,
    manifest TEXT NOT NULL,
    checksum TEXT,
    source_slug TEXT,
    synced_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(slug, version)
);

CREATE INDEX IF NOT EXISTS idx_mcp_registry_slug ON mcp_registry(slug);

CREATE TABLE IF NOT EXISTS mcp_servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    installed_version TEXT,
    status TEXT NOT NULL DEFAULT 'stopped',
    install_path TEXT,
    auto_start INTEGER NOT NULL DEFAULT 0,
    config TEXT,
    secrets TEXT,
    last_health_check TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

