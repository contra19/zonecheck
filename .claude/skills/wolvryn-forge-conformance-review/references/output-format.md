# Conformance Review — Output Format

Defines the two artifacts every review produces: the **report** and the **draft remediation
prompt**. This is the contract; the lane lenses supply the findings that fill it.

## 1. The report

```
## Conformance Review — <change/diff identifier>
Reviewed: <what was reviewed — files / diff>
Mode: manual (two-surface) | harnessed
Overall: BLOCK | PASS-WITH-FLAGS | PASS

### Security — <strictness> — <BLOCK|FLAG|PASS>
- [BLOCK] <title> — <file:line> — violates <wolvryn-forge-security: section> — <one-line why>
- [FLAG]  <title> — <file:line> — <one-line why>

### Testing — <strictness> — <verdict>
- [BLOCK] Test suite does not run — <evidence> — (hard block, always)
- [BLOCK] <missing coverage> — <module> — <wolvryn-forge-testing: rule>

### Code — <strictness> — <verdict>
- [BLOCK] <title> — <file:line> — <wolvryn-forge-code-standards: rule>

### Architecture — <strictness> — <verdict>
- [FLAG-ROUTE] <divergence> — code says X; ARCHITECTURE.md / ADR-NNN says Y —
  branch A (code wrong → fix code) / branch B (doc stale → update doc) — gate decides

### Observability — stubbed (no active criteria)
- (no findings — lane pending wolvryn-forge-observability)
```

**Report rules:**
- Every lane appears, even on PASS. A lane with nothing to report says PASS — it is never
  omitted (silence is not a verdict).
- Every finding names the specific standard/rule it fails, by skill and section.
- Overall verdict: BLOCK if any lane BLOCKs; PASS-WITH-FLAGS if only FLAGs; PASS if clean.
- The report never contains secrets, keys, tokens, or PII — describe a finding without
  reproducing the sensitive value.

## 2. The draft remediation prompt

A ready-to-use implementer prompt that resolves the BLOCKs, written to FORGE prompt rules:
one concern per prompt, specific, naming the standard each fix must meet. It is a PROPOSAL.

```
[DRAFT REMEDIATION PROMPT — proposal, requires gate approval before dispatch (manual mode)]

Fix the following conformance BLOCKs in <file>:
1. <BLOCK> — <what must change> — must meet <standard: section>
2. <BLOCK> — <what must change> — must meet <standard: section>

Each fix: <test / verify expectation>.
Run format + tests + build before reporting done.
```

**Remediation-prompt rules:**
- Addresses BLOCKs only. FLAGs are not auto-remediated — the gate decides if any FLAG becomes
  work.
- If the BLOCKs span independently-testable concerns, emit MULTIPLE draft prompts (one per
  concern), never one batched prompt — batched prompts produce batched bugs.
- The prompt specifies WHAT must change and the standard it must meet; it does NOT write the
  fix code. Implementation is the coder's job.
- Marked a proposal. In manual mode it is never dispatched without the gate; in harnessed mode
  it is dispatched within the harness only.