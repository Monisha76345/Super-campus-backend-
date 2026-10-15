# Project prompt

`prompt.txt` is the **project-level prompt** that defines this backend’s architecture, tech stack, and coding standards.

## How it’s loaded in Cursor

- A Cursor rule in **`.cursor/rules/project-prompt.mdc`** is set to `alwaysApply: true`.
- That rule tells the AI to read and follow `prompt/prompt.txt` for all work in this repo.
- You don’t need to paste or re-attach the prompt in each chat; the rule keeps it in scope.

## Using the prompt elsewhere

- **In chat**: Mention “follow the project prompt” or “see prompt/prompt.txt” so the AI uses it.
- **In code/docs**: Point contributors to `prompt/prompt.txt` as the single source of truth for architecture and standards.

The concrete folder layout and layer rules used in this repo are also written in `docs/PROJECT_GUIDE.md` and `docs/ARCHITECTURE_AND_CODE_STRUCTURE.md`.
