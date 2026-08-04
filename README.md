# @pipeworx/ncbi-eutils

NCBI [E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25500/) MCP — federated search and fetch across all NCBI Entrez databases: PubMed, Gene, Nucleotide, Protein, Taxonomy, ClinVar, dbSNP, OMIM, BioProject, BioSample, SRA, … Keyless (3 req/s without key).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `einfo(db?)` — database info / field list
- `esearch(db, term, retmax?, retstart?, sort?)` — search → uid list
- `esummary(db, ids, retstart?)` — summary records by uid
- `efetch(db, ids, rettype?, retmode?)` — full records
- `elink(dbfrom, dbto, ids, linkname?)` — links across databases
- `egquery(term)` — global query across all databases

## Data source

`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "ncbi-eutils": {
      "url": "https://gateway.pipeworx.io/ncbi-eutils/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Ncbi Eutils data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
