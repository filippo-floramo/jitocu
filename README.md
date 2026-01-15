# jitocu

**Jira to ClickUp** - Copy Jira issues assigned to you to ClickUp with an interactive terminal UI.

## Prerequisites

- [Bun](https://bun.sh) runtime installed
- Jira account with API access
- ClickUp account with API access

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ticket-maker
```

1. Install dependencies:

```bash
bun install
```

1. Set up environment variables:

```bash
cp .env.example .env
```

1. Edit `.env` with your credentials:

```env
JIRA_DOMAIN="your-domain.atlassian.net"
JIRA_EMAIL="your-email@example.com"
JIRA_API_TOKEN="your-jira-api-token"
CLICKUP_API_TOKEN="your-clickup-api-token"
CLICKUP_WORKSPACE_ID="your-workspace-id"
```

## Getting API Tokens

### Jira API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label and copy the token

### ClickUp API Token

1. Log in to your ClickUp account
1. Click your avatar in the bottom-left corner
1. Select **Settings**
1. Click **Apps** in the left sidebar
1. Under "API Token", click **Generate** (or **Regenerate** if you already have one)
1. Click **Copy** to copy your API token
1. Store it securely - you won't be able to see it again

### ClickUp Workspace ID

1. Log in to ClickUp and navigate to your workspace
1. Click **Settings** in the sidebar
1. Click **Workspaces**
1. Your Workspace ID is displayed under the workspace name (it's a numeric ID like `2156096`)
1. Alternatively, you can find it in the URL when viewing your workspace: `https://app.clickup.com/{WORKSPACE_ID}/...`

## Usage

Run the CLI tool:

```bash
bun start
```

Or in development mode with auto-reload:

```bash
bun run dev
```

### Workflow

1. **Fetch Jira Issues** - The tool fetches all issues assigned to you
2. **Select Issues** - Use fuzzy search to find and select issues (multi-select with space, confirm with enter)
3. **Choose Folder** - Select a ClickUp shared folder
4. **Choose List** - Select a list within the folder
5. **Create Tasks** - Tasks are created in ClickUp with your name as assignee

## Project Structure

```text
ticket-maker/
├── src/
│   ├── cli.ts              # Main CLI application
│   ├── types.ts            # TypeScript type definitions
│   └── clients/
│       ├── jira.ts         # Jira API client
│       └── clickUp.ts      # ClickUp API client
├── .env.example            # Environment variables template
├── package.json
└── README.md
```

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript
- **CLI Framework**: [Commander.js](https://github.com/tj/commander.js)
- **Prompts**: [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js), [inquirer-checkbox-plus-plus](https://github.com/faressoft/inquirer-checkbox-plus-prompt)
- **Fuzzy Search**: [fuzzy](https://github.com/mattyork/fuzzy)
- **Loading Indicators**: [ora](https://github.com/sindresorhus/ora)

## Development

The codebase is fully typed with TypeScript. Key features:

- **Type-safe API clients** for both Jira and ClickUp
- **Error handling** with descriptive messages
- **Loading states** for all async operations
- **Environment validation** on startup

## License

MIT
