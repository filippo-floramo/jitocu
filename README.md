# jitocu

**Jira to ClickUp** - Copy Jira issues assigned to you to ClickUp with an interactive terminal UI.

## Prerequisites

- [Bun](https://bun.sh) runtime installed (required for development only)
- Jira account with API access
- ClickUp account with API access

## Installation

Install globally via npm:

```bash
npm install -g jitocu
```

Or with Bun:

```bash
bun install -g jitocu
```

After installation, configure your credentials:

```bash
jitocu config
```

> **Note:** The `config` command will detect missing settings and prompt you to set them up interactively. You can also set values manually using `jitocu config set <path> <value>`.

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
1. Your Workspace ID is displayed under the workspace name (it's a numeric ID like `1234567`)
1. Alternatively, you can find it in the URL when viewing your workspace: `https://app.clickup.com/{WORKSPACE_ID}/...`

## Usage

### Configuration

Configure your Jira and ClickUp credentials:

```bash
jitocu config
```

The config command will:

- Check for missing settings
- **Prompt you to set them up interactively** if any are missing
- Guide you through the setup process

**Manual configuration (optional):**

```bash
# Set individual values
jitocu config set jira.domain 'your-domain.atlassian.net'
jitocu config set jira.email 'your-email@example.com'
jitocu config set jira.apiToken 'your-jira-token'
jitocu config set clickUp.apiToken 'your-clickup-token'
jitocu config set clickUp.workspaceId 'your-workspace-id'

# View a specific setting
jitocu config get jira.domain

# List all settings
jitocu config list
```

### Interactive Copy (Main Feature)

Copy Jira issues to ClickUp interactively:

```bash
jitocu
```

**Workflow:**

1. 🔍 **Search Issues** - Type to fuzzy search your Jira issues
2. ✅ **Select Issue** - Choose the issue you want to copy
3. 📁 **Choose Folder** - Select a ClickUp shared folder
4. 📋 **Choose List** - Select a list within the folder
5. ✨ **Task Created** - Your Jira issue is now in ClickUp!

### Create Single Ticket

Quickly create a ClickUp task from a Jira issue without interactive prompts:

```bash
jitocu create --key PROJ-123 --list "My List Name"
```

**Required flags:**

- `-k, --key <ISSUE-KEY>` - Jira issue key (e.g., PROJ-123)
- `-l, --list <LIST-NAME>` - ClickUp list name where the task will be created

**Example:**

```bash
jitocu create -k PROJ-456 -l "Sprint Backlog"
```

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript
- **CLI Framework**: [Commander.js](https://github.com/tj/commander.js)
- **Prompts**: [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js)
- **Fuzzy Search**: [fuzzy](https://github.com/mattyork/fuzzy)
- **Loading Indicators**: [ora](https://github.com/sindresorhus/ora)
- **Styling**: [chalk](https://github.com/chalk/chalk)

## Development

### Setup for Contributors

- Clone the repository:

```bash
git clone <repository-url>
cd jitocu
```

- Install dependencies:

```bash
bun install
```

- Configure your credentials:

```bash
bun run src/cli.ts config
```

- Run in development mode with auto-reload:

```bash
bun run dev
```

### Build and Test

Build for distribution:

```bash
bun run build
```

Test the built CLI globally:

```bash
bun link
jitocu --help
```

Run tests:

```bash
bun test
```

### Key Features

- Type-safe API clients for Jira and ClickUp
- Persistent configuration storage with JSON
- Interactive CLI with fuzzy search
- Loading states and error handling
- Atomic settings updates

## License

MIT
