# Release Process

## SecureStore v1.0.0

The local release is represented by:

- Git tag: `v1.0.0`
- Release name: `SecureStore`
- Docker image name: `securestore:1.0.0`

## Local Release Checklist

1. Run `npx tsc --noEmit`.
2. Run `cargo test -p secure_vault_backend`.
3. Run `npm run build`.
4. Build the container with `docker build -t securestore:1.0.0 .`.
5. Commit all files.
6. Create the annotated tag with `git tag -a v1.0.0 -m "SecureStore"`.

## GitHub Release

If a GitHub remote and authenticated `gh` CLI are available:

```bash
gh release create v1.0.0 --title "SecureStore" --notes-file CHANGELOG.md
```

If no remote exists, push the repository first:

```bash
git remote add origin <your-securestore-repo-url>
git push -u origin main
git push origin v1.0.0
```
