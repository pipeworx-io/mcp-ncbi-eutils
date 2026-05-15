interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * NCBI E-utilities MCP — federated Entrez search/fetch.
 *
 * Auth: none. Optional API key raises rate limit from 3 → 10 req/s.
 * Docs: https://www.ncbi.nlm.nih.gov/books/NBK25497/
 */


const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const UA = 'pipeworx-mcp-ncbi-eutils/1.0 (tool=pipeworx; email=ops@pipeworx.io; +https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'einfo',
    description: 'Database info / field list.',
    inputSchema: {
      type: 'object',
      properties: { db: { type: 'string', description: 'Optional db name; omit for global db list.' } },
    },
  },
  {
    name: 'esearch',
    description: 'Search a database → uid list.',
    inputSchema: {
      type: 'object',
      properties: {
        db: { type: 'string' },
        term: { type: 'string' },
        retmax: { type: 'number', description: '1-10000 (default 20)' },
        retstart: { type: 'number' },
        sort: { type: 'string', description: 'e.g. "pub_date" (PubMed), "relevance"' },
      },
      required: ['db', 'term'],
    },
  },
  {
    name: 'esummary',
    description: 'Summary records by uid.',
    inputSchema: {
      type: 'object',
      properties: {
        db: { type: 'string' },
        ids: { type: 'array', items: { type: 'string' } },
        retstart: { type: 'number' },
      },
      required: ['db', 'ids'],
    },
  },
  {
    name: 'efetch',
    description: 'Full records. Returns text (XML/GenBank/FASTA/…) per rettype.',
    inputSchema: {
      type: 'object',
      properties: {
        db: { type: 'string' },
        ids: { type: 'array', items: { type: 'string' } },
        rettype: { type: 'string', description: 'e.g. "abstract", "fasta", "gb", "xml"' },
        retmode: { type: 'string', description: 'text (default) | xml | json' },
      },
      required: ['db', 'ids'],
    },
  },
  {
    name: 'elink',
    description: 'Links across databases.',
    inputSchema: {
      type: 'object',
      properties: {
        dbfrom: { type: 'string' },
        dbto: { type: 'string' },
        ids: { type: 'array', items: { type: 'string' } },
        linkname: { type: 'string', description: 'Specific link, e.g. "pubmed_protein"' },
      },
      required: ['dbfrom', 'dbto', 'ids'],
    },
  },
  {
    name: 'egquery',
    description: 'Global query across all Entrez databases.',
    inputSchema: {
      type: 'object',
      properties: { term: { type: 'string' } },
      required: ['term'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'einfo': {
      const params = baseParams();
      if (args.db) params.set('db', String(args.db));
      return ncbiJson(`/einfo.fcgi?${params}`);
    }
    case 'esearch': {
      const params = baseParams();
      params.set('db', reqStr(args, 'db', '"pubmed"'));
      params.set('term', reqStr(args, 'term', '"CRISPR"'));
      params.set('retmax', String(Math.min(10000, Math.max(1, (args.retmax as number) ?? 20))));
      if (args.retstart != null) params.set('retstart', String(args.retstart));
      if (args.sort) params.set('sort', String(args.sort));
      return ncbiJson(`/esearch.fcgi?${params}`);
    }
    case 'esummary': {
      const params = baseParams();
      params.set('db', reqStr(args, 'db', '"pubmed"'));
      params.set('id', reqArr(args, 'ids', '["35713434"]').join(','));
      if (args.retstart != null) params.set('retstart', String(args.retstart));
      return ncbiJson(`/esummary.fcgi?${params}`);
    }
    case 'efetch': {
      const params = new URLSearchParams();
      params.set('db', reqStr(args, 'db', '"pubmed"'));
      params.set('id', reqArr(args, 'ids', '["35713434"]').join(','));
      params.set('tool', 'pipeworx');
      params.set('email', 'ops@pipeworx.io');
      if (args.rettype) params.set('rettype', String(args.rettype));
      params.set('retmode', String(args.retmode ?? 'text'));
      const res = await fetch(`${BASE}/efetch.fcgi?${params}`, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`NCBI efetch: ${res.status}`);
      const ct = res.headers.get('content-type') ?? '';
      if (ct.includes('json')) return res.json();
      return { content_type: ct, body: await res.text() };
    }
    case 'elink': {
      const params = baseParams();
      params.set('dbfrom', reqStr(args, 'dbfrom', '"pubmed"'));
      params.set('db', reqStr(args, 'dbto', '"protein"'));
      params.set('id', reqArr(args, 'ids', '["35713434"]').join(','));
      if (args.linkname) params.set('linkname', String(args.linkname));
      return ncbiJson(`/elink.fcgi?${params}`);
    }
    case 'egquery': {
      const params = baseParams();
      params.set('term', reqStr(args, 'term', '"CRISPR"'));
      return ncbiJson(`/egquery.fcgi?${params}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function baseParams(): URLSearchParams {
  return new URLSearchParams({
    retmode: 'json',
    tool: 'pipeworx',
    email: 'ops@pipeworx.io',
  });
}

async function ncbiJson(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (res.status === 429) throw new Error('NCBI: 429 rate-limit.');
  if (!res.ok) throw new Error(`NCBI: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}

function reqArr(args: Record<string, unknown>, key: string, example: string): string[] {
  const v = args[key];
  if (!Array.isArray(v) || v.length === 0) {
    throw new Error(`Required argument "${key}" must be a non-empty array, e.g. ${example}.`);
  }
  return v.filter((s): s is string => typeof s === 'string' || typeof s === 'number').map(String);
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
