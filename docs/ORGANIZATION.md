# Trivon / Airlux organization and development guidelines

Reviewed: 2026-11-18 (Asia/Colombo). These are proposed operating guidelines. Repository and organization setting changes require a separate, recorded maintainer action. This documentation update does not apply them.

## Ownership and attribution

Keep Airlux in the Trivon organization. The original team owns credit for its design, workflows, and implementation. Sathnuwan Dassana is the current continuation maintainer; describe completed migration, testing, deployment, and maintenance work with links to evidence. Original authorship remains in Git history.

Use a GitHub-linked email for new commits. Preserve authors when importing existing work. Use real co-author trailers only for actual joint work. AI review or assistance is not independent human approval. CV descriptions must distinguish team-created functionality from your completed improvements.

Keep at least two trusted organization owners when the team can support that arrangement; owner access is for governance and account recovery. Use individual GitHub accounts with 2FA and separate service integrations rather than shared accounts or credentials. Give active contributors Write, an operational maintainer Maintain, and Admin/Owner only where settings or organization administration require it. Historical credit does not depend on retaining broad administrative access. Review access when a teammate changes responsibilities.

GitHub guidance: [organization best practices](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/best-practices-for-organizations).

## Branches and rules that permit normal development

Use `dev` for integration and the default PR target after the baseline transition. Use `main` for tested releases. Feature branches use `feat/<short-task>`, fixes `fix/<short-task>`, and maintenance `chore/<short-task>`. Keep one active feature at a time for the current one-hour daily schedule.

### Findings from the actual repositories

| Setting | Frontend | Backend |
|---|---|---|
| Default branch | main | main |
| dev ruleset | Require approval on dev (20957020) | Require approval on dev (20957116) |
| Required approvals | 0 | 0 |
| Restrict updates | Enabled | Enabled |
| Bypass | One User, always mode | Same User, always mode |
| Required CI checks in this ruleset | None | None |
| Auto-delete merged branches | Disabled | Disabled |
| Auto-merge | Disabled | Disabled |

A direct push and normal merge of the baseline PRs were both rejected. The restriction on updates plus the single bypass actor is the apparent cause; it is not a request for one more review. Check every applicable repository/organization ruleset before changing settings because protections can overlap.

### Proposed settings

| Rule | dev | main |
|---|---|---|
| Require PR | Yes | Yes |
| Required checks | Frontend: build-and-test; backend: hosting | Same checks plus release verification described below |
| Required human approvals while only one developer is active | 0, with a written PR self-review | 0, with a recorded release checklist |
| When a second reviewer is available | 1 independent review | 1 independent review |
| Resolve review conversations | Yes | Yes |
| Block force pushes and branch deletion | Yes | Yes |
| Restrict updates | Off for normal development; use PR/CI rules instead | Keep the current freeze until release reconciliation, then use PR/CI rules |
| Always bypass | No routine use | No routine use |
| Linear history requirement | Off while preserving original merged history | Off |

Select required checks from a successful run of the intended workflow and bind them to GitHub Actions where the UI supports selecting an expected source. Add gates only after those workflows exist on the target baseline. Do not require a check that is manual-only or never runs for the PR: that creates another deadlock.

Rename the current dev rulesets to describe their real policy, e.g. `dev / PR and CI`. If an emergency bypass is retained, limit it to named accountable maintainers and PR-only use where appropriate; record why it was used. Do not solve ordinary PR merging by routinely using administrator overrides or granting everyone an always-bypass role.

GitHub explains [Restrict updates and PR rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) and [bypass modes](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository).

### Transition order

1. An authorized ruleset editor reviews overlapping protections and applies the agreed dev policy in both repositories, retaining PR, force-push, and deletion protections.
2. Merge frontend #73 and backend #71 with merge commits to preserve the original baseline history. Use the documented baseline verification for this bootstrap step; do not pretend future CI already ran on those old branches.
3. Retarget frontend #74 and backend #72 from dev-new to dev, review the implementation, and require passing checks on the retargeted PRs before merging.
4. Set dev as the GitHub default and enable its exact CI gates. Confirm that an ordinary feature PR can merge through the normal workflow.
5. Remove the temporary dev-new CI target after the transition. Keep historical branches until the branch inventory accounts for their work.
6. Reconcile old main history separately before its first release. Keep production-branch selection in hosting explicit; changing the GitHub default does not change it automatically.

## Small tasks and reviewable PRs

Use one backlog, not separate duplicate task lists. During migration, docs/MIGRATION.md is the execution tracker. If a shared GitHub Project becomes useful later, use one organization project across both repos with Backlog, Ready, In progress, Review, and Done; move the live task board there and keep the migration document as roadmap and handoff.

Each task needs: a short ID, intended outcome, repository, dependencies, and a concrete completion check. Split work into 30–45-minute edits. Use a parent task and linked frontend/backend tasks when an API contract changes. Label scope with a small set: ui, backend, deployment, docs, bug, and blocked. Treat production blockers separately from visual polish.

Every PR explains the user-visible result, task ID, checks with outcomes, paired changes, known limitations, and rollback impact. Keep unrelated fixes out. Prefer a merge commit as the default to retain the team commit history and authored checkpoints. Do not squash a contributor's existing branch history during baseline consolidation. A solo maintainer may perform a written self-review but must not claim it was independent review.

Use draft PRs while work is incomplete. Request reviews from active people who can actually respond. If CODEOWNERS is introduced, assign real active owners with repository access and keep it advisory while the sole owner would otherwise be reviewing their own PR. Require owner review only when there is a second eligible reviewer. See [GitHub code-owner behavior](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).

## Releases, hosting, and operational ownership

Keep frontend/API repositories separate and link paired releases. A release record includes the release label, both commit SHAs, public URLs, migrations if any, verification evidence, known issues, and rollback targets. Use matching release tags in both repos for a coordinated release; record differing SHAs explicitly.

Deploy backward-compatible API changes before a dependent frontend. Verify backend readiness, then the browser workflow. A rollback of code does not undo a database migration; any future data migration needs a separate backup/restore plan. Never reset a deployed database as part of an automated build or startup.

Use organization-owned hosting projects where the service/plan permits it. With personal free-tier accounts, record the project owner and recovery/transfer procedure; do not share account passwords. Keep local, staging/demo, and future production secrets and databases separate. Commit placeholder environment examples, store actual secrets in the appropriate platform, and rotate credentials when access changes or exposure is confirmed. Historical .env files require separate credential review without republishing their contents.

The current Render Free setup is a portfolio demo: sleeping services, disabled recurring jobs, and non-delivering email are recorded limitations. Do not label it production-ready. Before an actual production release, fix the documented backend failures and inventory audit-role mismatch, run the full diagnostics, move required suites into automatically triggered release-PR CI, then require those successful checks. A manual diagnostic workflow alone cannot enforce a release gate.

Keep main promotion deliberate; enable auto-merge only if it respects the selected checks and review policy. Retire the old dev-new→prod promotion path after checking whether anything still depends on it. Do not delete prod or change its hosting assignment blindly.

After a feature PR is merged, delete its short-lived branch after checking dependent PRs and documentation links. Retain dev/main and branches carrying unmerged work. Review old personal branches once, classify them as integrated/equivalent/deferred/obsolete, then archive or remove only those whose work is accounted for.

## A routine that fits one hour per day

Use five minutes to read the handoff, forty for one implementation task, ten for relevant checks, and five to record the next action. Once per week, use ten minutes of that session to review blockers, open PRs, and the next tasks. Once per month, review access, hosting usage, stale branches, and dependency/security alerts.

Done means acceptance checks pass, results are recorded, paired changes are linked, and the handoff is current. Deployment tasks stay pending until the actual hosted URL is verified. Documentation and formatting tasks do not need a full application test rerun unless they change executable behavior.

## Configuration checklist (recommendations, pending)

- [ ] Agree active maintainer and trusted recovery owner; review access.
- [ ] Replace the dev update lock with the agreed normal PR/CI policy in both repos.
- [ ] Complete baseline merges, retarget implementation PRs, then set dev as default.
- [ ] Configure the exact successful CI checks after workflow installation.
- [ ] Keep main release control explicit and document hosting ownership.
- [ ] Verify the public synthetic-data demo and record rollback targets.
- [ ] Account for old branches before cleanup; preserve contributor credit.
