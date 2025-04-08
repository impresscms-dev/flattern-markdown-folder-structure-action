[![License](https://img.shields.io/github/license/impresscms-dev/flattern-markdown-folder-structure-action.svg)](LICENSE)
[![GitHub release](https://img.shields.io/github/release/impresscms-dev/flattern-markdown-folder-structure-action.svg)](https://github.com/impresscms-dev/flattern-markdown-folder-structure-action/releases)

# Flattern Markdown Folder Structure

A GitHub Action that flattens a directory structure containing Markdown files while preserving and updating internal links between documents.

## What This Action Does

This action:

1. Takes a directory containing Markdown files in a nested folder structure
2. Moves all files to the root of that directory
3. Renames files to avoid naming conflicts (adding folder path in parentheses when needed)
4. Updates all internal links between documents to maintain proper references

This is particularly useful for documentation generation workflows where you want a flat structure for publishing or deployment.

## Usage

To use this action in your project, create a workflow in your GitHub repository similar to this example (customize as needed):
```yaml
name: Generate and Flatten Documentation

on:
  push:
    branches: [main, master]

jobs:
  flatten_docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      # Generate documentation (example using PHP docs generator)
      - name: Generate documentation
        uses: impresscms-dev/generate-phpdocs-with-clean-phpdoc-md-action@v0.1.4
        with:
          class_root_namespace: YourNamespace\
          included_classes: YourNamespace\**
          output_path: ./docs/

      # Flatten the documentation structure
      - name: Flatten documentation structure
        uses: impresscms-dev/flattern-markdown-folder-structure-action@v2
        with:
          path: ./docs/

      # Optional: Upload the flattened docs as an artifact
      - name: Upload documentation
        uses: actions/upload-artifact@v4
        with:
          name: documentation
          path: ./docs/
```

## Arguments

This action supports the following arguments (used with the `with` keyword):

| Argument | Required | Default value | Description |
|----------|----------|---------------|-------------|
| path     | Yes      | -             | Path to the folder containing Markdown files that should be flattened |

## How File Renaming Works

When flattening the directory structure, the action:

1. Moves all files to the root directory
2. If filename conflicts occur, the action renames files by adding the original folder path in parentheses
   - Example: `subfolder/document.md` becomes `document (subfolder).md`
3. Updates all internal Markdown links to maintain proper references between documents

## Examples

### Before Flattening
```
docs/
├── README.md
├── getting-started.md
├── api/
│   ├── endpoints.md
│   └── authentication.md
└── guides/
    ├── installation.md
    └── configuration.md
```

### After Flattening
```
docs/
├── README.md
├── getting-started.md
├── endpoints (api).md
├── authentication (api).md
├── installation (guides).md
└── configuration (guides).md
```

## How to Contribute

If you want to add functionality or fix bugs, you can fork the repository, make your changes, and create a pull request. If you're not sure how this works, check out GitHub's [fork a repo](https://docs.github.com/en/get-started/quickstart/fork-a-repo) and [creating a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request) guides.

If you find a bug or have questions, please use the [issues tab](https://github.com/impresscms-dev/flattern-markdown-folder-structure-action/issues) to report them.
