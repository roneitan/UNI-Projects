import { simpleGit } from 'simple-git';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fse from 'fs-extra';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPOS_DIR = resolve(__dirname, '../../repos');
const WORKSPACES_DIR = resolve(__dirname, '../../workspaces');

/**
 * Deduplication map: repo URL → Promise<localPath>
 * Multiple services pointing at the same repo only trigger one clone/pull.
 */
const syncPromises = new Map();

/**
 * Derive a stable, filesystem-safe directory name from a repo URL.
 * https://dev.azure.com/org/project/_git/my-repo → my-repo
 */
function repoLocalName(url) {
  return url.split('/').filter(Boolean).pop().replace(/[^a-zA-Z0-9-_]/g, '-');
}

/**
 * Build a simpleGit instance that authenticates via the ADO_MCP_AUTH_TOKEN
 * env var using an HTTP Authorization header — avoids embedding the PAT in URLs.
 */
function authedGit(baseDir) {
  const pat = process.env.ADO_MCP_AUTH_TOKEN ?? '';
  const b64 = Buffer.from(`:${pat}`).toString('base64');
  return simpleGit(baseDir, {
    config: [`http.extraHeader=Authorization: Basic ${b64}`],
  });
}

/**
 * Ensure the repo is cloned locally and up-to-date.
 * Clones on first call; pulls on subsequent calls.
 * Calls for the same URL are deduplicated.
 *
 * @param {{ url: string, branch?: string, subPath?: string|null }} repoConfig
 * @returns {Promise<string>} Absolute path to the (sub)directory within the repo
 */
export async function ensureRepo(repoConfig) {
  const { url, branch = 'main', subPath = null } = repoConfig;

  if (!syncPromises.has(url)) {
    syncPromises.set(url, _syncRepo(url, branch));
  }

  const localPath = await syncPromises.get(url);
  return subPath ? join(localPath, subPath) : localPath;
}

async function _syncRepo(url, branch) {
  await fse.ensureDir(REPOS_DIR);
  const localPath = join(REPOS_DIR, repoLocalName(url));

  if (existsSync(join(localPath, '.git'))) {
    console.log(`[gitSync] Pulling ${repoLocalName(url)} (${branch})`);
    const git = authedGit(localPath);
    await git.fetch('origin');
    await git.checkout(branch);
    await git.pull('origin', branch, ['--ff-only']);
  } else {
    console.log(`[gitSync] Cloning ${repoLocalName(url)}`);
    // Auth via env for clone: embed PAT in URL temporarily, then reset remote
    const pat = process.env.ADO_MCP_AUTH_TOKEN ?? '';
    const authUrl = url.replace('https://', `https://pat:${pat}@`);
    await simpleGit().clone(authUrl, localPath, ['--branch', branch]);
    // Strip the PAT from the stored remote URL
    await simpleGit(localPath).remote(['set-url', 'origin', url]);
  }

  return localPath;
}

/**
 * Create an isolated git worktree on a new branch for a fix run.
 * The worktree is branched off the current HEAD of the main clone.
 *
 * @param {{ url: string }} repoConfig
 * @param {string} worktreeName  - Unique name for the workspace dir
 * @param {string} fixBranch     - Name of the new branch to create
 * @returns {Promise<string>} Absolute path to the worktree
 */
export async function createWorktree(repoConfig, worktreeName, fixBranch) {
  const localPath = join(REPOS_DIR, repoLocalName(repoConfig.url));
  const worktreePath = join(WORKSPACES_DIR, worktreeName);

  await fse.ensureDir(WORKSPACES_DIR);

  const git = simpleGit(localPath);
  await git.raw(['worktree', 'add', '-b', fixBranch, worktreePath]);

  console.log(`[gitSync] Worktree created: ${worktreePath} → branch ${fixBranch}`);
  return worktreePath;
}

/**
 * Check for changes in a worktree, commit them, and push the fix branch.
 *
 * @param {string} worktreePath
 * @param {string} fixBranch
 * @param {string} commitMessage
 * @returns {Promise<boolean>} true if changes were committed and pushed
 */
export async function commitAndPush(worktreePath, fixBranch, commitMessage) {
  const git = authedGit(worktreePath);
  const status = await git.status();

  if (status.files.length === 0) {
    console.log(`[gitSync] No changes in worktree — skipping push`);
    return false;
  }

  await git.add('.');
  await git.commit(commitMessage);
  await git.push('origin', fixBranch, ['--set-upstream']);
  console.log(`[gitSync] Pushed branch ${fixBranch} (${status.files.length} file(s) changed)`);
  return true;
}

/**
 * Remove a worktree after use. Logs a warning but does not throw on failure
 * so a cleanup error never masks the main result.
 *
 * @param {{ url: string }} repoConfig
 * @param {string} worktreePath
 */
export async function removeWorktree(repoConfig, worktreePath) {
  try {
    const localPath = join(REPOS_DIR, repoLocalName(repoConfig.url));
    await simpleGit(localPath).raw(['worktree', 'remove', '--force', worktreePath]);
    console.log(`[gitSync] Worktree removed: ${worktreePath}`);
  } catch (err) {
    console.warn(`[gitSync] Could not remove worktree ${worktreePath}: ${err.message}`);
  }
}

/** Clear the deduplication cache — useful between test runs. */
export function clearSyncCache() {
  syncPromises.clear();
}
