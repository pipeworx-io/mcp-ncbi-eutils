# mcp-ncbi-eutils

NCBI E-utilities MCP — federated Entrez search/fetch.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 673+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `einfo` | Database info / field list. |
| `esearch` | Search a database → uid list. |
| `esummary` | Summary records by uid. |
| `efetch` | Full records. Returns text (XML/GenBank/FASTA/…) per rettype. |
| `elink` | Links across databases. |
| `egquery` | Global query across all Entrez databases. |

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

Or connect to the full Pipeworx gateway for access to all 673+ data sources:

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

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
